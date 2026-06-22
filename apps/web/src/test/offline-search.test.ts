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
    await createItem({ householdId: 'household-1', createdBy: 'user-1', updatedBy: 'user-1', deviceId: 'device-1', name: 'Silver spoon', category: 'Kitchenware', currentLocationId: drawer.id, notes: 'For soup', dueAt: '2026-07-01', tagNames: ['metal', 'daily'] });
    await createItem({ householdId: 'household-1', createdBy: 'user-1', updatedBy: 'user-1', deviceId: 'device-1', name: 'Garden hose', category: 'Outdoor', currentLocationId: other.id, notes: '', dueAt: '2026-08-01', tagNames: ['garden'] });
    const metal = await db.tags.where('normalizedName').equals('metal').first();
    const results = await searchItems('household-1', { query: 'spoon', category: 'Kitchenware', tagIds: [metal!.id], locationId: room.id, status: 'active', dueFrom: '2026-06-01', dueTo: '2026-07-31' });
    expect(results.map((result) => result.item.name)).toEqual(['Silver spoon']);
    expect(results[0].location?.path).toBe('Kitchen / Utensil drawer');
    expect(await searchItems('household-1', { query: 'garden', locationId: room.id })).toHaveLength(0);
  });
});
