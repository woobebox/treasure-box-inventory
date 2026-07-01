import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { createLocation } from '../db/locationRepository';
import { addCategoryOption, addLocationTypeOption, listCategoryOptions, listLocationTypeOptions, removeCategoryOption, removeLocationTypeOption } from '../db/optionRepository';

describe('managed inventory options', () => {
  afterEach(async () => { await db.delete(); await db.open(); });

  it('adds and removes custom category options', async () => {
    await addCategoryOption('household-1', '露營用品');
    expect(await listCategoryOptions('household-1')).toContain('露營用品');

    await removeCategoryOption('household-1', '露營用品');
    expect(await listCategoryOptions('household-1')).not.toContain('露營用品');
  });

  it('adds and removes custom location type options', async () => {
    await addLocationTypeOption('household-1', '展示架');
    expect(await listLocationTypeOptions('household-1')).toContainEqual({ value: '展示架', label: '展示架' });

    await removeLocationTypeOption('household-1', '展示架');
    expect(await listLocationTypeOptions('household-1')).not.toContainEqual({ value: '展示架', label: '展示架' });
  });

  it('prevents removing location types that are still used by locations', async () => {
    await addLocationTypeOption('household-1', '保險箱');
    await createLocation({ householdId: 'household-1', name: '重要文件櫃', type: '保險箱' });

    await expect(removeLocationTypeOption('household-1', '保險箱')).rejects.toThrow('仍有 1 個位置使用');
  });
});
