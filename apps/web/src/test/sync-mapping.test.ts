import { describe, expect, it } from 'vitest';
import { camelToRow, rowToCamel } from '../../../../supabase/functions/_shared/mapping';
import { createItem } from '../features/items/createItem';
import { db } from '../db/database';

describe('sync mapping', () => {
  it('round-trips camelCase domain objects through snake_case rows', () => {
    const item = {
      id: 'item-1', householdId: 'household-1', createdBy: 'user-1', updatedBy: 'user-1',
      currentLocationId: 'loc-1', coverPhotoId: null, name: '行動電源', normalizedName: '行動電源',
      category: '電子', status: 'active', notes: undefined, dueAt: null, version: 2,
      createdAt: '2026-06-29T00:00:00.000Z', updatedAt: '2026-06-29T00:00:00.000Z', deletedAt: null
    };
    const row = camelToRow(item);
    // snake_case keys land in the row
    expect(row).toMatchObject({ household_id: 'household-1', current_location_id: 'loc-1', normalized_name: '行動電源', cover_photo_id: null });
    // undefined values are dropped, not serialized as null
    expect('notes' in row).toBe(false);
    // reverse mapping restores the camelCase shape pull.ts expects
    const back = rowToCamel(row);
    expect(back).toMatchObject({ householdId: 'household-1', currentLocationId: 'loc-1', normalizedName: '行動電源', coverPhotoId: null, version: 2 });
  });

  it('keeps nested JSONB payloads untouched (shallow mapping)', () => {
    const history = { id: 'h1', householdId: 'hh1', itemId: 'i1', actorId: 'u1', action: 'item.created', changedFields: { tagNames: ['a', 'b'], hasPhoto: true }, deviceId: 'd1', occurredAt: '2026-06-29T00:00:00.000Z' };
    const row = camelToRow(history);
    expect(row.changed_fields).toEqual({ tagNames: ['a', 'b'], hasPhoto: true });
  });

  it('uses the canonical op naming the push handler dispatches on', async () => {
    const result = await createItem({
      householdId: 'household-map', createdBy: 'user-1', updatedBy: 'user-1', deviceId: 'device-1',
      currentLocationId: 'loc-1', name: '測試物品', category: '其他', tagNames: []
    });
    const op = await db.syncOps.get(result.syncOp.id);
    expect(op?.opType).toBe('item.create');
    expect(op?.entityType).toBe('items');
  });
});
