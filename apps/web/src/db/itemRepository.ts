import { db } from './database';
import type { Item } from '../domain/types';
import { normalizeText, nowIso } from '../domain/utils';

export interface ItemDraft {
  id: string;
  householdId: string;
  createdBy: string;
  updatedBy: string;
  currentLocationId: string;
  name: string;
  category: string;
  notes?: string;
  coverPhotoId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function validateItemDraft(draft: ItemDraft): void {
  if (!draft.householdId.trim()) throw new Error('缺少家庭識別碼');
  if (!draft.createdBy.trim()) throw new Error('缺少建立者識別碼');
  if (!draft.updatedBy.trim()) throw new Error('缺少更新者識別碼');
  if (!draft.currentLocationId.trim()) throw new Error('請選擇位置');
  if (!draft.name.trim()) throw new Error('請輸入物品名稱');
  if (draft.name.trim().length > 120) throw new Error('物品名稱最多 120 字');
  if (!draft.category.trim()) throw new Error('請輸入分類');
}

export function buildItem(draft: ItemDraft): Item {
  validateItemDraft(draft);
  const timestamp = draft.createdAt ?? nowIso();
  return {
    id: draft.id,
    householdId: draft.householdId,
    createdBy: draft.createdBy,
    updatedBy: draft.updatedBy,
    currentLocationId: draft.currentLocationId,
    coverPhotoId: draft.coverPhotoId ?? null,
    name: draft.name.trim(),
    normalizedName: normalizeText(draft.name),
    category: draft.category.trim(),
    status: 'active',
    notes: draft.notes?.trim() || undefined,
    createdAt: timestamp,
    updatedAt: draft.updatedAt ?? timestamp,
    deletedAt: null,
    version: 1
  };
}

export async function putItem(item: Item): Promise<string> {
  if (!item.householdId) throw new Error('缺少家庭識別碼');
  return db.items.put(item);
}

export async function getItemById(householdId: string, itemId: string): Promise<Item | undefined> {
  if (!householdId) throw new Error('缺少家庭識別碼');
  const item = await db.items.get(itemId);
  return item?.householdId === householdId ? item : undefined;
}

export async function listItemsByHousehold(householdId: string): Promise<Item[]> {
  if (!householdId) throw new Error('缺少家庭識別碼');
  return db.items.where('householdId').equals(householdId).filter((item) => !item.deletedAt).toArray();
}

export async function listDeletedItemsByHousehold(householdId: string): Promise<Item[]> {
  if (!householdId) throw new Error('缺少家庭識別碼');
  return db.items.where('householdId').equals(householdId).filter((item) => !!item.deletedAt).sortBy('deletedAt');
}

export async function updateItem(item: Item, patch: Partial<Omit<Item, 'id' | 'householdId' | 'createdAt'>>): Promise<Item> {
  const updated: Item = { ...item, ...patch, updatedAt: nowIso(), version: (item.version ?? 0) + 1 };
  if (patch.name) updated.normalizedName = normalizeText(patch.name);
  await putItem(updated);
  return updated;
}
