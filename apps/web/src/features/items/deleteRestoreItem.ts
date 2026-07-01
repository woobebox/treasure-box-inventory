import Dexie from 'dexie';
import { db } from '../../db/database';
import type { HouseholdMember, Item } from '../../domain/types';
import { nowIso } from '../../domain/utils';
import { isWithinSoftDeleteRetention } from '../../domain/retention';
import { canDeleteOrRestore } from '../../services/authorization';
import { buildHistoryEntry, HISTORY_ACTIONS } from '../../db/historyRepository';
import { buildSyncOp } from '../../sync/syncOpFactory';

export interface DeleteRestoreInput { householdId: string; itemId: string; actorId: string; deviceId: string; member?: HouseholdMember; }

export async function softDeleteItem(input: DeleteRestoreInput): Promise<Item> {
  if (!canDeleteOrRestore(input.member)) throw new Error('只有家庭管理者可以刪除物品。');
  const item = await db.items.get(input.itemId);
  if (!item || item.householdId !== input.householdId) throw new Error('找不到物品');
  const timestamp = nowIso();
  const updated: Item = { ...item, status: 'deleted', deletedAt: timestamp, updatedBy: input.actorId, updatedAt: timestamp, version: (item.version ?? 0) + 1 };
  const history = buildHistoryEntry({ householdId: input.householdId, itemId: item.id, actorId: input.actorId, action: HISTORY_ACTIONS.ITEM_DELETED, changedFields: { status: { from: item.status, to: 'deleted' } }, deviceId: input.deviceId });
  const syncOp = buildSyncOp({ householdId: input.householdId, actorId: input.actorId, deviceId: input.deviceId, opType: 'item.delete', entityType: 'items', entityId: item.id, baseVersion: item.version ?? null, payload: { item: updated, historyEntry: history } });
  await db.transaction('rw', [db.items, db.history, db.syncOps], async () => {
    await db.items.put(updated);
    await db.history.put(history);
    await db.syncOps.put(syncOp);
  });
  return updated;
}

export async function restoreItem(input: DeleteRestoreInput): Promise<Item> {
  if (!canDeleteOrRestore(input.member)) throw new Error('只有家庭管理者可以還原物品。');
  const item = await db.items.get(input.itemId);
  if (!item || item.householdId !== input.householdId) throw new Error('找不到物品');
  if (!item.deletedAt || !isWithinSoftDeleteRetention(item.deletedAt)) throw new Error('物品已超過 30 天還原期限。');
  const timestamp = nowIso();
  const updated: Item = { ...item, status: 'active', deletedAt: null, updatedBy: input.actorId, updatedAt: timestamp, version: (item.version ?? 0) + 1 };
  const history = buildHistoryEntry({ householdId: input.householdId, itemId: item.id, actorId: input.actorId, action: HISTORY_ACTIONS.ITEM_RESTORED, changedFields: { status: { from: 'deleted', to: 'active' } }, deviceId: input.deviceId });
  const syncOp = buildSyncOp({ householdId: input.householdId, actorId: input.actorId, deviceId: input.deviceId, opType: 'item.restore', entityType: 'items', entityId: item.id, baseVersion: item.version ?? null, payload: { item: updated, historyEntry: history } });
  await db.transaction('rw', [db.items, db.history, db.syncOps], async () => {
    await db.items.put(updated);
    await db.history.put(history);
    await db.syncOps.put(syncOp);
  });
  return updated;
}

export async function cleanupExpiredSoftDeletedItems(householdId: string, now: Date = new Date()): Promise<number> {
  const deleted = await db.items.where('householdId').equals(householdId).filter((item) => item.status === 'deleted' && !!item.deletedAt && !isWithinSoftDeleteRetention(item.deletedAt, now)).toArray();
  await db.transaction('rw', [db.items, db.photos, db.itemTags], async () => {
    for (const item of deleted) {
      await db.photos.where('itemId').equals(item.id).delete();
      await db.itemTags.where('[itemId+tagId]').between([item.id, Dexie.minKey], [item.id, Dexie.maxKey]).delete();
      await db.items.delete(item.id);
    }
  });
  return deleted.length;
}
