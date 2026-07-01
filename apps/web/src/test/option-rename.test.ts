import { describe, expect, it } from 'vitest';
import { db } from '../db/database';
import {
  addCategoryOption,
  addLocationTypeOption,
  listCategoryOptions,
  listLocationTypeOptions,
  removeCategoryOption,
  renameCategoryOption,
  renameLocationTypeOption
} from '../db/optionRepository';
import { createItem } from '../features/items/createItem';
import { createLocation } from '../db/locationRepository';

const actor = { actorId: 'u1', deviceId: 'd1' };

describe('rename category option', () => {
  it('renames a custom category and cascades to items with a sync op', async () => {
    const hh = 'hh-cat';
    await addCategoryOption(hh, '露營用品');
    const { itemId } = await createItem({ householdId: hh, createdBy: 'u1', updatedBy: 'u1', deviceId: 'd1', name: '帳篷', category: '露營用品', currentLocationId: 'loc-1', notes: '', tagNames: [] });

    const count = await renameCategoryOption(hh, '露營用品', '戶外用品', actor);
    expect(count).toBe(1);
    expect(await listCategoryOptions(hh)).toContain('戶外用品');
    expect(await listCategoryOptions(hh)).not.toContain('露營用品');
    const item = await db.items.get(itemId);
    expect(item?.category).toBe('戶外用品');
    const op = await db.syncOps.where('entityId').equals(itemId).filter((o) => o.opType === 'item.update').first();
    expect(op).toBeDefined();
  });

  it('rejects renaming to an existing category', async () => {
    const hh = 'hh-cat2';
    await addCategoryOption(hh, '甲');
    await addCategoryOption(hh, '乙');
    await expect(renameCategoryOption(hh, '甲', '乙', actor)).rejects.toThrow('已存在');
  });

  it('rejects renaming a default category', async () => {
    await expect(renameCategoryOption('hh-cat3', '工具', '工具箱', actor)).rejects.toThrow('預設分類');
  });

  it('blocks removing a category still in use', async () => {
    const hh = 'hh-cat4';
    await addCategoryOption(hh, '臨時');
    await createItem({ householdId: hh, createdBy: 'u1', updatedBy: 'u1', deviceId: 'd1', name: '物', category: '臨時', currentLocationId: 'loc-1', notes: '', tagNames: [] });
    await expect(removeCategoryOption(hh, '臨時')).rejects.toThrow('仍有');
  });
});

describe('rename location type option', () => {
  it('renames a custom location type and cascades to locations with a sync op', async () => {
    const hh = 'hh-loc';
    await addLocationTypeOption(hh, '展示架');
    const location = await createLocation({ householdId: hh, name: '客廳架', type: '展示架' });

    const count = await renameLocationTypeOption(hh, '展示架', '陳列架', actor);
    expect(count).toBe(1);
    expect((await listLocationTypeOptions(hh)).some((o) => o.value === '陳列架')).toBe(true);
    const updated = await db.locations.get(location.id);
    expect(updated?.type).toBe('陳列架');
    const op = await db.syncOps.where('entityId').equals(location.id).filter((o) => o.opType === 'location.update').first();
    expect(op).toBeDefined();
  });
});
