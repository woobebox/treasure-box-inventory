import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { createItem } from '../features/items/createItem';

describe('offline item creation', () => {
  afterEach(async () => {
    await db.delete();
    await db.open();
  });

  it('atomically stores household-scoped item, photo metadata, tags, history, and pending sync op', async () => {
    const result = await createItem({
      householdId: 'household-1',
      createdBy: 'user-1',
      updatedBy: 'user-1',
      deviceId: 'device-1',
      name: 'Winter gloves',
      category: 'Clothing',
      currentLocationId: 'drawer-1',
      notes: 'Keep by the door',
      dueAt: null,
      tagNames: ['winter', 'clothing'],
      photo: {
        storageKey: 'household-1/items/main.webp',
        thumbKey: 'household-1/items/thumb.webp',
        localMainBlobKey: 'compressed-main-only',
        localThumbBlobKey: 'compressed-thumb-only',
        width: 1200,
        height: 900,
        mimeType: 'image/webp',
        byteSize: 1000,
        thumbByteSize: 100,
        takenAt: null
      }
    });

    const item = await db.items.get(result.itemId);
    expect(item?.householdId).toBe('household-1');
    expect(item?.normalizedName).toBe('winter gloves');
    expect(item?.coverPhotoId).toBe(result.photo?.id);

    const photos = await db.photos.where('itemId').equals(result.itemId).toArray();
    expect(photos).toHaveLength(1);
    expect(photos[0]).toMatchObject({ householdId: 'household-1', exifStripped: true, originalRetained: false });

    const itemTags = await db.itemTags.where('itemId').equals(result.itemId).toArray();
    expect(itemTags.every((row) => row.householdId === 'household-1')).toBe(true);
    expect(itemTags).toHaveLength(2);

    const history = await db.history.where('itemId').equals(result.itemId).toArray();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ householdId: 'household-1', action: 'item.created', toLocationId: 'drawer-1' });

    const syncOps = await db.syncOps.where('entityId').equals(result.itemId).toArray();
    expect(syncOps).toHaveLength(1);
    expect(syncOps[0]).toMatchObject({ householdId: 'household-1', status: 'pending', entityType: 'item' });
  });

  it('rejects missing household scope', async () => {
    await expect(createItem({
      householdId: '', createdBy: 'user-1', updatedBy: 'user-1', deviceId: 'device-1', name: 'Box', category: 'Storage', currentLocationId: 'loc-1', notes: '', dueAt: null, tagNames: []
    })).rejects.toThrow('household_id is required');
  });
});
