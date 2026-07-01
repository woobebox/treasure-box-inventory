import { describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { createItem } from '../features/items/createItem';
import { addPhoto } from '../features/items/addPhoto';
import { removePhoto } from '../features/items/removePhoto';
import { softDeleteItem, restoreItem } from '../features/items/deleteRestoreItem';
import type { HouseholdMember } from '../domain/types';
import type { RetainedPhotoPayload } from '../media/photoRetentionPolicy';

const admin: HouseholdMember = { id: 'm-admin', householdId: 'hh', userId: 'u1', role: 'admin', status: 'active', createdAt: '', updatedAt: '' };
const member: HouseholdMember = { id: 'm-member', householdId: 'hh', userId: 'u2', role: 'member', status: 'active', createdAt: '', updatedAt: '' };

function photoPayload(): RetainedPhotoPayload {
  const blob = new Blob(['x'], { type: 'image/jpeg' });
  const image = { blob, width: 10, height: 10, mimeType: 'image/jpeg' as const, byteSize: 1, objectUrl: 'blob:x' };
  return {
    main: image, thumbnail: image,
    metadata: { storageKey: 'k/main.jpg', thumbKey: 'k/thumb.jpg', localMainBlobKey: 'm', localThumbBlobKey: 't', width: 10, height: 10, mimeType: 'image/jpeg', byteSize: 1, thumbByteSize: 1, exifStripped: true, originalRetained: false, takenAt: null }
  };
}

async function makeItem(householdId: string) {
  return createItem({ householdId, createdBy: 'u1', updatedBy: 'u1', deviceId: 'd1', name: '相機', category: '電子', currentLocationId: 'loc-1', notes: '', tagNames: [] });
}

describe('photo management', () => {
  it('adds a photo, persists its blob, sets it as cover when none, and enqueues photo.add without the blob', async () => {
    const { itemId } = await makeItem('hh-photo');
    const photo = await addPhoto({ householdId: 'hh-photo', itemId, actorId: 'u1', deviceId: 'd1', payload: photoPayload() });
    const item = await db.items.get(itemId);
    expect(item?.coverPhotoId).toBe(photo.id);
    expect(await db.photoBlobs.get(photo.id)).toBeDefined();
    const op = await db.syncOps.where('entityId').equals(photo.id).first();
    expect(op?.opType).toBe('photo.add');
    expect(JSON.stringify(op?.payload)).not.toContain('blob');
  });

  it('removing the cover photo moves the cover to a surviving photo', async () => {
    const { itemId } = await makeItem('hh-photo2');
    const first = await addPhoto({ householdId: 'hh-photo2', itemId, actorId: 'u1', deviceId: 'd1', payload: photoPayload() });
    const second = await addPhoto({ householdId: 'hh-photo2', itemId, actorId: 'u1', deviceId: 'd1', payload: photoPayload() });
    await removePhoto({ householdId: 'hh-photo2', itemId, photoId: first.id, actorId: 'u1', deviceId: 'd1' });
    const item = await db.items.get(itemId);
    expect(item?.coverPhotoId).toBe(second.id);
    expect(await db.photoBlobs.get(first.id)).toBeUndefined();
    const removed = await db.photos.get(first.id);
    expect(removed?.version).toBe(2);
    const removeOp = await db.syncOps.where('entityId').equals(first.id).filter((op) => op.opType === 'photo.remove').first();
    expect(removeOp?.baseVersion).toBe(1);
  });
});

describe('soft delete / restore', () => {
  it('admin can soft-delete and the op is enqueued', async () => {
    const { itemId } = await makeItem('hh-del');
    const updated = await softDeleteItem({ householdId: 'hh-del', itemId, actorId: 'u1', deviceId: 'd1', member: admin });
    expect(updated.status).toBe('deleted');
    expect(updated.deletedAt).toBeTruthy();
    const op = await db.syncOps.where('entityId').equals(itemId).filter((o) => o.opType === 'item.delete').first();
    expect(op).toBeDefined();
    const restored = await restoreItem({ householdId: 'hh-del', itemId, actorId: 'u1', deviceId: 'd1', member: admin });
    expect(restored.status).toBe('active');
  });

  it('non-admin members cannot delete', async () => {
    const { itemId } = await makeItem('hh-del2');
    await expect(softDeleteItem({ householdId: 'hh-del2', itemId, actorId: 'u2', deviceId: 'd1', member })).rejects.toThrow('只有家庭管理者');
  });
});
