import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { listItemHistory, HISTORY_ACTIONS } from '../db/historyRepository';
import { createLocation } from '../db/locationRepository';
import { createItem } from '../features/items/createItem';
import { moveItem } from '../features/items/moveItem';

describe('offline item move history', () => {
  afterEach(async () => { await db.delete(); await db.open(); });
  it('updates the current location and records history with a pending SyncOp', async () => {
    const shelf = await createLocation({ householdId: 'household-1', name: 'Shelf', type: 'room' });
    const box = await createLocation({ householdId: 'household-1', name: 'Box', type: 'box' });
    const created = await createItem({ householdId: 'household-1', createdBy: 'user-1', updatedBy: 'user-1', deviceId: 'device-1', name: 'Passport', category: 'Documents', currentLocationId: shelf.id, tagNames: ['important'] });
    const result = await moveItem({ householdId: 'household-1', itemId: created.itemId, toLocationId: box.id, actorId: 'user-1', deviceId: 'device-1' });
    expect(result.item.currentLocationId).toBe(box.id);
    const history = await listItemHistory('household-1', created.itemId);
    expect(history.some((entry) => entry.action === HISTORY_ACTIONS.ITEM_MOVED && entry.fromLocationId === shelf.id && entry.toLocationId === box.id)).toBe(true);
    const pending = await db.syncOps.where('entityId').equals(created.itemId).filter((op) => op.status === 'pending' && op.opType === 'item.move').toArray();
    expect(pending).toHaveLength(1);
  });
});
