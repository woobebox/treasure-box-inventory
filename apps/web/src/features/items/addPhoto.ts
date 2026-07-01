import { db } from '../../db/database';
import { buildPhotoMetadata } from '../../db/photoRepository';
import { buildHistoryEntry, HISTORY_ACTIONS } from '../../db/historyRepository';
import { buildSyncOp } from '../../sync/syncOpFactory';
import { createId, nowIso } from '../../domain/utils';
import type { Photo } from '../../domain/types';
import type { RetainedPhotoPayload } from '../../media/photoRetentionPolicy';

export interface AddPhotoInput { householdId: string; itemId: string; actorId: string; deviceId: string; payload: RetainedPhotoPayload; }

// Add a photo to an existing item: persist metadata + local thumbnail Blob,
// make it the cover when the item has none yet, record history, and enqueue a
// photo.add sync op (metadata only — the Blob never enters the payload).
export async function addPhoto(input: AddPhotoInput): Promise<Photo> {
  const item = await db.items.get(input.itemId);
  if (!item || item.householdId !== input.householdId) throw new Error('找不到物品');
  const timestamp = nowIso();
  const photoId = createId();
  const photo = buildPhotoMetadata({ ...input.payload.metadata, id: photoId, householdId: input.householdId, itemId: input.itemId, createdAt: timestamp, updatedAt: timestamp });
  const history = buildHistoryEntry({ householdId: input.householdId, itemId: input.itemId, actorId: input.actorId, action: HISTORY_ACTIONS.PHOTO_ADDED, changedFields: { photoId }, deviceId: input.deviceId });
  const syncOp = buildSyncOp({ householdId: input.householdId, actorId: input.actorId, deviceId: input.deviceId, opType: 'photo.add', entityType: 'photos', entityId: photoId, baseVersion: null, payload: { photo, historyEntry: history } });

  await db.transaction('rw', [db.items, db.photos, db.photoBlobs, db.history, db.syncOps], async () => {
    await db.photos.put(photo);
    await db.photoBlobs.put({ photoId, thumbnail: input.payload.thumbnail.blob });
    if (!item.coverPhotoId) await db.items.update(item.id, { coverPhotoId: photoId, updatedAt: timestamp });
    await db.history.put(history);
    await db.syncOps.put(syncOp);
  });
  return photo;
}
