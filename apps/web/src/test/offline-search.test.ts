import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { createLocation } from '../db/locationRepository';
import { createItem } from '../features/items/createItem';
import { searchItems } from '../features/search/searchService';

describe('offline local search', () => {
  afterEach(async () => { await db.delete(); await db.open(); });

  it('filters by text, category, tag, location descendants, status, and due date', async () => {
    const room = await createLocation({ householdId: 'household-1', name: 'Kitchen', type: 'room' });
    const drawer = await createLocation({ householdId: 'household-1', parentId: room.id, name: 'Utensil drawer', type: 'drawer' });
    const other = await createLocation({ householdId: 'household-1', name: 'Garage', type: 'room' });
    await createItem({ householdId: 'household-1', createdBy: 'user-1', updatedBy: 'user-1', deviceId: 'device-1', name: 'Silver spoon', category: 'Kitchenware', currentLocationId: drawer.id, notes: 'For soup', tagNames: ['metal', 'daily'] });
    await createItem({ householdId: 'household-1', createdBy: 'user-1', updatedBy: 'user-1', deviceId: 'device-1', name: 'Garden hose', category: 'Outdoor', currentLocationId: other.id, notes: '', tagNames: ['garden'] });
    const metal = await db.tags.where('normalizedName').equals('metal').first();
    const results = await searchItems('household-1', { query: 'spoon', category: 'Kitchenware', tagIds: [metal!.id], locationId: room.id, status: 'active' });
    expect(results.map((result) => result.item.name)).toEqual(['Silver spoon']);
    expect(results[0].location?.path).toBe('Kitchen / Utensil drawer');
    expect(await searchItems('household-1', { query: 'garden', locationId: room.id })).toHaveLength(0);
  });

  it('sorts deterministically by update time, creation time, and name', async () => {
    const location = await createLocation({ householdId: 'household-sort', name: '櫃子', type: 'cabinet' });
    const alpha = await createItem({ householdId: 'household-sort', createdBy: 'u1', updatedBy: 'u1', deviceId: 'd1', name: 'Alpha', category: '其他', currentLocationId: location.id, notes: '', tagNames: [] });
    const beta = await createItem({ householdId: 'household-sort', createdBy: 'u1', updatedBy: 'u1', deviceId: 'd1', name: 'Beta', category: '其他', currentLocationId: location.id, notes: '', tagNames: [] });
    await db.items.update(alpha.itemId, { createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-03-01T00:00:00.000Z' });
    await db.items.update(beta.itemId, { createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z' });
    expect((await searchItems('household-sort', { sort: 'updated-desc' })).map((row) => row.item.name)).toEqual(['Alpha', 'Beta']);
    expect((await searchItems('household-sort', { sort: 'created-desc' })).map((row) => row.item.name)).toEqual(['Beta', 'Alpha']);
    expect((await searchItems('household-sort', { sort: 'name-asc' })).map((row) => row.item.name)).toEqual(['Alpha', 'Beta']);
  });
});
