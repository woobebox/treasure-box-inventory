import { db } from '../../db/database';
import { buildHistoryEntry, HISTORY_ACTIONS } from '../../db/historyRepository';
import { buildSyncOp } from '../../sync/syncOpFactory';
import { nowIso } from '../../domain/utils';

export interface RemovePhotoInput { householdId: string; itemId: string; photoId: string; actorId: string; deviceId: string; }

// Soft-delete a photo: mark deletedAt, drop the local thumbnail Blob, move the
// cover to another surviving photo (or none), record history, and enqueue a
// photo.remove sync op.
export async function removePhoto(input: RemovePhotoInput): Promise<void> {
  const photo = await db.photos.get(input.photoId);
  if (!photo || photo.householdId !== input.householdId) throw new Error('找不到照片');
  const item = await db.items.get(input.itemId);
  const timestamp = nowIso();
  const removed = { ...photo, deletedAt: timestamp, updatedAt: timestamp };
  const history = buildHistoryEntry({ householdId: input.householdId, itemId: input.itemId, actorId: input.actorId, action: HISTORY_ACTIONS.PHOTO_REMOVED, changedFields: { photoId: input.photoId }, deviceId: input.deviceId });
  const syncOp = buildSyncOp({ householdId: input.householdId, actorId: input.actorId, deviceId: input.deviceId, opType: 'photo.remove', entityType: 'photos', entityId: input.photoId, baseVersion: null, payload: { photoId: input.photoId, photo: removed, historyEntry: history } });

  await db.transaction('rw', [db.items, db.photos, db.photoBlobs, db.history, db.syncOps], async () => {
    await db.photos.put(removed);
    await db.photoBlobs.delete(input.photoId);
    if (item && item.coverPhotoId === input.photoId) {
      const next = await db.photos.where('itemId').equals(input.itemId).filter((p) => p.householdId === input.householdId && !p.deletedAt && p.id !== input.photoId).first();
      await db.items.update(item.id, { coverPhotoId: next?.id ?? null, updatedAt: timestamp });
    }
    await db.history.put(history);
    await db.syncOps.put(syncOp);
  });
}
