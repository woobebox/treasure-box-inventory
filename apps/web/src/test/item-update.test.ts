import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { createItem } from '../features/items/createItem';
import { updateItemDetails } from '../features/items/updateItemDetails';

describe('item details update', () => {
  afterEach(async () => { await db.delete(); await db.open(); });

  it('atomically updates details, tags, history and pending sync payload', async () => {
    const created = await createItem({ householdId: 'hh-update', createdBy: 'u1', updatedBy: 'u1', deviceId: 'd1', name: '舊相機', category: '收藏品', currentLocationId: 'box-1', notes: '', tagNames: ['舊標籤'] });
    const before = await db.items.get(created.itemId);
    const result = await updateItemDetails({ householdId: 'hh-update', itemId: created.itemId, actorId: 'u1', deviceId: 'd1', name: '新相機', category: '備品', notes: '已換電池', tagNames: ['旅行', '電子'] });
    expect(result.item).toMatchObject({ name: '新相機', normalizedName: '新相機', category: '備品', notes: '已換電池', version: (before?.version ?? 0) + 1 });
    const links = await db.itemTags.where('itemId').equals(created.itemId).toArray();
    expect(links).toHaveLength(2);
    expect(result.historyEntry.action).toBe('item.updated');
    expect(result.syncOp).toMatchObject({ opType: 'item.update', baseVersion: before?.version, status: 'pending' });
    expect(result.syncOp.payload).toMatchObject({ item: result.item, tagNames: ['旅行', '電子'], historyEntry: result.historyEntry });
  });

  it('rejects cross-household item access', async () => {
    const created = await createItem({ householdId: 'hh-a', createdBy: 'u1', updatedBy: 'u1', deviceId: 'd1', name: '箱子', category: '其他', currentLocationId: 'loc-1', notes: '', tagNames: [] });
    await expect(updateItemDetails({ householdId: 'hh-b', itemId: created.itemId, actorId: 'u1', deviceId: 'd1', name: '越權', category: '其他', notes: '', tagNames: [] })).rejects.toThrow('找不到物品');
  });
});
