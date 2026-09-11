import { db } from '../../db/database';
import { buildHistoryEntry, HISTORY_ACTIONS } from '../../db/historyRepository';
import { getItemById, validateItemDraft } from '../../db/itemRepository';
import { findOrCreateTag, replaceItemTags } from '../../db/tagRepository';
import { normalizeText, nowIso } from '../../domain/utils';
import { buildSyncOp } from '../../sync/syncOpFactory';
import type { HistoryEntry, Item, SyncOp, Tag } from '../../domain/types';

export interface UpdateItemDetailsInput {
  householdId: string;
  itemId: string;
  actorId: string;
  deviceId: string;
  name: string;
  category: string;
  notes: string;
  tagNames: string[];
}

export interface UpdateItemDetailsResult { item: Item; tags: Tag[]; historyEntry: HistoryEntry; syncOp: SyncOp; }

export async function updateItemDetails(input: UpdateItemDetailsInput): Promise<UpdateItemDetailsResult> {
  const current = await getItemById(input.householdId, input.itemId);
  if (!current) throw new Error('找不到物品');
  if (!input.actorId.trim()) throw new Error('缺少操作者識別碼');
  if (!input.deviceId.trim()) throw new Error('缺少裝置識別碼');
  validateItemDraft({ ...current, name: input.name, category: input.category, notes: input.notes, updatedBy: input.actorId });
  const normalizedTags = [...new Set(input.tagNames.map((tag) => tag.trim()).filter(Boolean))];
  const tooLong = normalizedTags.find((tag) => tag.length > 40);
  if (tooLong) throw new Error(`標籤「${tooLong}」超過 40 字`);

  const timestamp = nowIso();
  const item: Item = {
    ...current,
    name: input.name.trim(),
    normalizedName: normalizeText(input.name),
    category: input.category.trim(),
    notes: input.notes.trim() || undefined,
    updatedBy: input.actorId,
    updatedAt: timestamp,
    version: (current.version ?? 0) + 1,
  };
  const historyEntry = buildHistoryEntry({
    householdId: input.householdId,
    itemId: item.id,
    actorId: input.actorId,
    action: HISTORY_ACTIONS.ITEM_UPDATED,
    changedFields: { name: { from: current.name, to: item.name }, category: { from: current.category, to: item.category }, notes: { from: current.notes ?? '', to: item.notes ?? '' }, tagNames: normalizedTags },
    deviceId: input.deviceId,
    occurredAt: timestamp,
  });
  const syncOp = buildSyncOp({ householdId: input.householdId, actorId: input.actorId, deviceId: input.deviceId, opType: 'item.update', entityType: 'items', entityId: item.id, baseVersion: current.version ?? null, payload: { item, tagNames: normalizedTags, historyEntry } });

  return db.transaction('rw', [db.items, db.tags, db.itemTags, db.history, db.syncOps], async () => {
    const tags: Tag[] = [];
    for (const tagName of normalizedTags) tags.push(await findOrCreateTag(input.householdId, tagName));
    await db.items.put(item);
    await replaceItemTags(input.householdId, item.id, tags.map((tag) => tag.id));
    await db.history.put(historyEntry);
    await db.syncOps.put(syncOp);
    return { item, tags, historyEntry, syncOp };
  });
}
