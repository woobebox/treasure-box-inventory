import { db } from './database';
import { nowIso } from '../domain/utils';
import { buildSyncOp } from '../sync/syncOpFactory';
import { buildHistoryEntry, HISTORY_ACTIONS } from './historyRepository';

export interface LocationTypeOption {
  value: string;
  label: string;
}

// Actor context for cascade updates: when provided, items/locations changed by a
// rename are enqueued as sync ops so they propagate to the cloud.
export interface OptionActor { actorId: string; deviceId: string; }

const categoryOptionsKey = 'category-options';
const locationTypeOptionsKey = 'location-type-options';

export const defaultCategoryOptions = ['衣物', '工具', '收藏品', '藥品', '備品', '文件', '其他'];

export const defaultLocationTypeOptions: LocationTypeOption[] = [
  { value: 'room', label: '房間' },
  { value: 'cabinet', label: '櫃位' },
  { value: 'drawer', label: '抽屜' },
  { value: 'hook', label: '掛勾' },
  { value: 'box', label: '箱子' },
  { value: 'other', label: '其他' }
];

function normalizeOption(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function uniqueOptions(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.map(normalizeOption).filter(Boolean)) {
    const key = value.toLocaleLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result;
}

async function getStringArraySetting(householdId: string, key: string): Promise<string[]> {
  const setting = await db.settings.get([householdId, key]);
  return Array.isArray(setting?.value) ? setting.value.filter((value): value is string => typeof value === 'string') : [];
}

async function saveStringArraySetting(householdId: string, key: string, value: string[]): Promise<void> {
  await db.settings.put({ householdId, key, value: uniqueOptions(value), updatedAt: nowIso() });
}

export async function listCategoryOptions(householdId: string): Promise<string[]> {
  const custom = await getStringArraySetting(householdId, categoryOptionsKey);
  return uniqueOptions([...defaultCategoryOptions, ...custom]);
}

export async function addCategoryOption(householdId: string, category: string): Promise<string> {
  const nextCategory = normalizeOption(category);
  if (!nextCategory) throw new Error('請輸入分類名稱');
  if (nextCategory.length > 80) throw new Error('分類名稱最多 80 字');
  const existing = await getStringArraySetting(householdId, categoryOptionsKey);
  await saveStringArraySetting(householdId, categoryOptionsKey, [...existing, nextCategory]);
  return nextCategory;
}

export async function removeCategoryOption(householdId: string, category: string): Promise<void> {
  const existing = await getStringArraySetting(householdId, categoryOptionsKey);
  const removeKey = normalizeOption(category).toLocaleLowerCase();
  const usedCount = await db.items.where('householdId').equals(householdId).filter((item) => !item.deletedAt && item.category.toLocaleLowerCase() === removeKey).count();
  if (usedCount > 0) throw new Error(`此分類仍有 ${usedCount} 件物品使用，請先調整那些物品後再移除。`);
  await saveStringArraySetting(householdId, categoryOptionsKey, existing.filter((value) => value.toLocaleLowerCase() !== removeKey));
}

// Default options are built-in constants; renaming them would break data mapping
// and localization, so only custom options may be renamed/removed.
function assertNotDefaultCategory(name: string): void {
  if (defaultCategoryOptions.some((option) => option.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    throw new Error('預設分類無法重新命名。');
  }
}
function assertNotDefaultLocationType(value: string): void {
  if (defaultLocationTypeOptions.some((option) => option.value === value)) {
    throw new Error('預設位置類型無法重新命名。');
  }
}

export async function renameCategoryOption(householdId: string, oldName: string, newName: string, actor?: OptionActor): Promise<number> {
  const from = normalizeOption(oldName);
  const to = normalizeOption(newName);
  if (!to) throw new Error('請輸入分類名稱');
  if (to.length > 80) throw new Error('分類名稱最多 80 字');
  assertNotDefaultCategory(from);
  const existing = await getStringArraySetting(householdId, categoryOptionsKey);
  const all = await listCategoryOptions(householdId);
  if (to.toLocaleLowerCase() !== from.toLocaleLowerCase() && all.some((option) => option.toLocaleLowerCase() === to.toLocaleLowerCase())) {
    throw new Error(`分類「${to}」已存在。`);
  }
  await saveStringArraySetting(householdId, categoryOptionsKey, existing.map((value) => (value.toLocaleLowerCase() === from.toLocaleLowerCase() ? to : value)));
  // Cascade: update every item using the old category and enqueue sync ops.
  const fromKey = from.toLocaleLowerCase();
  const items = await db.items.where('householdId').equals(householdId).filter((item) => item.category.toLocaleLowerCase() === fromKey).toArray();
  for (const item of items) await cascadeItemCategory(item.id, to, actor);
  return items.length;
}

export async function renameLocationTypeOption(householdId: string, oldValue: string, newValue: string, actor?: OptionActor): Promise<number> {
  const from = normalizeOption(oldValue);
  const to = normalizeOption(newValue);
  if (!to) throw new Error('請輸入位置類型名稱');
  if (to.length > 40) throw new Error('位置類型名稱最多 40 字');
  assertNotDefaultLocationType(from);
  const existing = await getStringArraySetting(householdId, locationTypeOptionsKey);
  const all = await listLocationTypeOptions(householdId);
  if (to.toLocaleLowerCase() !== from.toLocaleLowerCase() && all.some((option) => option.value.toLocaleLowerCase() === to.toLocaleLowerCase())) {
    throw new Error(`位置類型「${to}」已存在。`);
  }
  await saveStringArraySetting(householdId, locationTypeOptionsKey, existing.map((value) => (value.toLocaleLowerCase() === from.toLocaleLowerCase() ? to : value)));
  const fromKey = from.toLocaleLowerCase();
  const locations = await db.locations.where('householdId').equals(householdId).filter((location) => location.type.toLocaleLowerCase() === fromKey).toArray();
  for (const location of locations) await cascadeLocationType(location.id, to, actor);
  return locations.length;
}

// Cascade helpers: update one entity's option string in a single transaction,
// bumping version and (when actor present) enqueuing the matching sync op.
async function cascadeItemCategory(itemId: string, category: string, actor?: OptionActor): Promise<void> {
  const timestamp = nowIso();
  await db.transaction('rw', [db.items, db.history, db.syncOps], async () => {
    const item = await db.items.get(itemId);
    if (!item) return;
    const updated = { ...item, category, updatedBy: actor?.actorId ?? item.updatedBy, updatedAt: timestamp, version: (item.version ?? 0) + 1 };
    await db.items.put(updated);
    if (actor) {
      const history = buildHistoryEntry({ householdId: item.householdId, itemId: item.id, actorId: actor.actorId, action: HISTORY_ACTIONS.ITEM_UPDATED, changedFields: { category: { from: item.category, to: category } }, deviceId: actor.deviceId, occurredAt: timestamp });
      await db.history.put(history);
      await db.syncOps.put(buildSyncOp({ householdId: item.householdId, actorId: actor.actorId, deviceId: actor.deviceId, opType: 'item.update', entityType: 'items', entityId: item.id, baseVersion: item.version ?? null, payload: { item: updated, historyEntry: history } }));
    }
  });
}

async function cascadeLocationType(locationId: string, type: string, actor?: OptionActor): Promise<void> {
  const timestamp = nowIso();
  await db.transaction('rw', [db.locations, db.syncOps], async () => {
    const location = await db.locations.get(locationId);
    if (!location) return;
    const updated = { ...location, type, updatedAt: timestamp, version: (location.version ?? 0) + 1 };
    await db.locations.put(updated);
    if (actor) {
      await db.syncOps.put(buildSyncOp({ householdId: location.householdId, actorId: actor.actorId, deviceId: actor.deviceId, opType: 'location.update', entityType: 'locations', entityId: location.id, baseVersion: location.version ?? null, payload: { location: updated } }));
    }
  });
}

export async function listLocationTypeOptions(householdId: string): Promise<LocationTypeOption[]> {
  const custom = await getStringArraySetting(householdId, locationTypeOptionsKey);
  const byValue = new Map(defaultLocationTypeOptions.map((option) => [option.value, option]));
  for (const value of uniqueOptions(custom)) byValue.set(value, { value, label: value });
  return [...byValue.values()];
}

export async function addLocationTypeOption(householdId: string, label: string): Promise<LocationTypeOption> {
  const nextLabel = normalizeOption(label);
  if (!nextLabel) throw new Error('請輸入位置類型名稱');
  if (nextLabel.length > 40) throw new Error('位置類型名稱最多 40 字');
  const existing = await getStringArraySetting(householdId, locationTypeOptionsKey);
  await saveStringArraySetting(householdId, locationTypeOptionsKey, [...existing, nextLabel]);
  return { value: nextLabel, label: nextLabel };
}

export async function removeLocationTypeOption(householdId: string, value: string): Promise<void> {
  const existing = await getStringArraySetting(householdId, locationTypeOptionsKey);
  const removeKey = normalizeOption(value).toLocaleLowerCase();
  const usedCount = await db.locations.where('householdId').equals(householdId).filter((location) => !location.deletedAt && location.type.toLocaleLowerCase() === removeKey).count();
  if (usedCount > 0) throw new Error(`此位置類型仍有 ${usedCount} 個位置使用，請先調整那些位置後再移除。`);
  await saveStringArraySetting(householdId, locationTypeOptionsKey, existing.filter((option) => option.toLocaleLowerCase() !== removeKey));
}
