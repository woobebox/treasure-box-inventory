import Dexie from 'dexie';
import { db } from '../../db/database';
import type { HouseholdMember } from '../../domain/types';
import { nowIso } from '../../domain/utils';
import { isWithinSoftDeleteRetention } from '../../domain/retention';
import { canDeleteOrRestore } from '../../services/authorization';

export async function softDeleteItem(itemId: string, member?: HouseholdMember): Promise<void> {
  if (!canDeleteOrRestore(member)) throw new Error('Only household admins can delete items.');
  await db.items.update(itemId, { status: 'deleted', deletedAt: nowIso(), updatedAt: nowIso() });
}

export async function restoreItem(itemId: string, member?: HouseholdMember): Promise<void> {
  if (!canDeleteOrRestore(member)) throw new Error('Only household admins can restore items.');
  const item = await db.items.get(itemId);
  if (!item?.deletedAt || !isWithinSoftDeleteRetention(item.deletedAt)) throw new Error('Item is outside the 30-day restore window.');
  await db.items.update(itemId, { status: 'active', deletedAt: null, updatedAt: nowIso() });
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
