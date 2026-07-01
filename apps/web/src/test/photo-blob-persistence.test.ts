import { describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { createItem } from '../features/items/createItem';

describe('photo blob persistence', () => {
  it('stores the thumbnail blob in photoBlobs keyed by cover photo id, not in the sync op', async () => {
    const thumbnail = new Blob(['fake-jpeg-bytes'], { type: 'image/jpeg' });
    const result = await createItem({
      householdId: 'household-blob', createdBy: 'user-1', updatedBy: 'user-1', deviceId: 'device-1',
      name: '相機', category: '電子', currentLocationId: 'loc-1', notes: '', tagNames: [],
      photo: {
        storageKey: 'household-blob/items/main.jpg', thumbKey: 'household-blob/items/thumb.jpg',
        localMainBlobKey: 'm', localThumbBlobKey: 't', width: 100, height: 100, mimeType: 'image/jpeg', byteSize: 10, thumbByteSize: 5
      },
      thumbnailBlob: thumbnail
    });

    const item = await db.items.get(result.itemId);
    expect(item?.coverPhotoId).toBeTruthy();
    const stored = await db.photoBlobs.get(item!.coverPhotoId!);
    // Note: fake-indexeddb does not preserve the Blob prototype across the
    // structured-clone round-trip (real IndexedDB does), so assert the record
    // was written and keyed correctly rather than the exact Blob instance.
    expect(stored).toBeDefined();
    expect(stored?.photoId).toBe(item!.coverPhotoId);
    expect(stored?.thumbnail).toBeDefined();

    // The sync op payload carries metadata only — never the Blob.
    expect(JSON.stringify(result.syncOp.payload)).not.toContain('fake-jpeg-bytes');
  });

  it('creates no photoBlobs entry when there is no photo', async () => {
    const before = await db.photoBlobs.count();
    await createItem({ householdId: 'household-blob2', createdBy: 'u', updatedBy: 'u', deviceId: 'd', name: '無照片', category: '其他', currentLocationId: 'loc-1', notes: '', tagNames: [] });
    expect(await db.photoBlobs.count()).toBe(before);
  });
});
