import { beforeEach, describe, expect, it } from 'vitest';
import { clearItemDraft, readItemDraft, writeItemDraft } from '../features/items/itemDraft';
import { emptyItemForm } from '../features/items/useItemForm';

describe('add item draft', () => {
  beforeEach(() => sessionStorage.clear());

  it('isolates drafts by household and user and excludes photo data', () => {
    writeItemDraft('hh-1', 'u-1', { ...emptyItemForm, name: '相機', category: '收藏品', locationId: 'box-1', notes: '易碎', tagNames: ['旅行'], photo: { privatePhotoData: 'must-not-persist' } as never });
    expect(readItemDraft('hh-1', 'u-1')).toEqual({ name: '相機', category: '收藏品', locationId: 'box-1', notes: '易碎', tagNames: ['旅行'] });
    expect(readItemDraft('hh-2', 'u-1')).toBeNull();
    expect(sessionStorage.getItem('treasure-box:item-draft:hh-1:u-1')).not.toContain('privatePhotoData');
    clearItemDraft('hh-1', 'u-1');
    expect(readItemDraft('hh-1', 'u-1')).toBeNull();
  });
});
