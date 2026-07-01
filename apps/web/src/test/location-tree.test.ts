import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { createLocation, updateLocation } from '../db/locationRepository';
import { createItem } from '../features/items/createItem';
import { buildLocationTree, collectDescendantLocationIds } from '../features/locations/locationTree';

describe('location tree', () => {
  afterEach(async () => { await db.delete(); await db.open(); });

  it('creates nested locations, prevents cycles, and includes descendant item counts', async () => {
    const room = await createLocation({ householdId: 'household-1', name: 'Garage', type: 'room' });
    const cabinet = await createLocation({ householdId: 'household-1', parentId: room.id, name: 'Tool cabinet', type: 'cabinet' });
    const drawer = await createLocation({ householdId: 'household-1', parentId: cabinet.id, name: 'Top drawer', type: 'drawer' });
    await expect(updateLocation({ householdId: 'household-1', id: room.id, parentId: drawer.id })).rejects.toThrow('階層循環');
    await createItem({ householdId: 'household-1', createdBy: 'user-1', updatedBy: 'user-1', deviceId: 'device-1', name: 'Socket set', category: 'Tools', currentLocationId: drawer.id, notes: '', tagNames: ['tools'] });
    const locations = await db.locations.where('householdId').equals('household-1').toArray();
    const items = await db.items.where('householdId').equals('household-1').toArray();
    expect(collectDescendantLocationIds(locations, room.id)).toEqual([room.id, cabinet.id, drawer.id]);
    const tree = buildLocationTree(locations, items);
    expect(tree[0].location.path).toBe('Garage');
    expect(tree[0].children[0].children[0].location.path).toBe('Garage / Tool cabinet / Top drawer');
    expect(tree[0].descendantItemCount).toBe(1);
  });
});
