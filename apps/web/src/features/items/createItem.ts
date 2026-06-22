import { db } from '../../db/database';
import { buildItem, type ItemDraft } from '../../db/itemRepository';
import { buildPhotoMetadata, type PhotoDraft } from '../../db/photoRepository';
import { findOrCreateTag, replaceItemTags } from '../../db/tagRepository';
import type { HistoryEntry, Photo, SyncOp, Tag } from '../../domain/types';
import { createId, nowIso } from '../../domain/utils';
import { buildSyncOp } from '../../sync/syncOpFactory';

export interface CreateItemInput extends Omit<ItemDraft, 'id' | 'coverPhotoId' | 'createdAt' | 'updatedAt'> {
  deviceId: string;
  tagNames: string[];
  photo?: Omit<PhotoDraft, 'id' | 'householdId' | 'itemId' | 'createdAt' | 'updatedAt'>;
}

export interface CreateItemResult { itemId: string; photo?: Photo; tags: Tag[]; history: HistoryEntry; syncOp: SyncOp; }

export async function createItem(input: CreateItemInput): Promise<CreateItemResult> {
  if (!input.householdId.trim()) throw new Error('household_id is required');
  if (!input.deviceId.trim()) throw new Error('deviceId is required');
  const timestamp = nowIso();
  const itemId = createId();
  const photoId = input.photo ? createId() : null;
  const item = buildItem({ ...input, id: itemId, coverPhotoId: photoId, createdAt: timestamp, updatedAt: timestamp });
  const photo = input.photo ? buildPhotoMetadata({ ...input.photo, id: photoId!, householdId: input.householdId, itemId, createdAt: timestamp, updatedAt: timestamp }) : undefined;
  const history: HistoryEntry = {
    id: createId(), householdId: input.householdId, itemId, actorId: input.createdBy, action: 'item.created',
    fromLocationId: null, toLocationId: input.currentLocationId, changedFields: { name: item.name, category: item.category, tagNames: input.tagNames, hasPhoto: Boolean(photo) },
    deviceId: input.deviceId, occurredAt: timestamp
  };
  const syncOp = buildSyncOp({ householdId: input.householdId, actorId: input.createdBy, deviceId: input.deviceId, opType: 'create', entityType: 'item', entityId: itemId, baseVersion: null, payload: { item, photo, tagNames: input.tagNames, history } });

  return db.transaction('rw', db.items, db.photos, db.tags, db.itemTags, db.history, db.syncOps, async () => {
    await db.items.put(item);
    if (photo) await db.photos.put(photo);
    const tags = [] as Tag[];
    for (const tagName of input.tagNames) tags.push(await findOrCreateTag(input.householdId, tagName));
    await replaceItemTags(input.householdId, itemId, tags.map((tag) => tag.id));
    await db.history.put(history);
    await db.syncOps.put(syncOp);
    return { itemId, photo, tags, history, syncOp };
  });
}
