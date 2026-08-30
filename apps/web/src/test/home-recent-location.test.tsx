import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import type { Item, Location } from '../domain/types';

vi.mock('../services/householdContextValue', () => ({
  useHousehold: () => ({ householdId: 'hh-home', householdName: '測試家庭' }),
}));

const { HomePage } = await import('../features/home/HomePage');

const at = '2026-07-01T08:00:00.000Z';
const location: Location = {
  id: 'loc-drawer', householdId: 'hh-home', parentId: null, type: 'drawer', name: '工具抽屜', path: '工作室 / 工具抽屜',
  sortOrder: 0, version: 1, createdAt: at, updatedAt: at, deletedAt: null,
};
const item: Item = {
  id: 'item-camera', householdId: 'hh-home', createdBy: 'u1', updatedBy: 'u1', currentLocationId: location.id,
  coverPhotoId: null, name: '相機', normalizedName: '相機', category: '電子', status: 'active', version: 1,
  createdAt: at, updatedAt: at, deletedAt: null,
};

describe('home recent items', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('resolves the stored location id to the location path', async () => {
    await db.locations.put(location);
    await db.items.put(item);

    render(<HomePage />);

    await waitFor(() => expect(screen.getByText(/使用中 · 工作室 \/ 工具抽屜/)).toBeInTheDocument());
    expect(screen.queryByText(/使用中 · 未設定位置/)).not.toBeInTheDocument();
  });

  it('shows the empty state and dashboard quick actions when there are no items', async () => {
    render(<HomePage />);

    expect(screen.queryByText('目前沒有本機物品')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: '正在整理家庭摘要…' })).toBeInTheDocument();
    expect(await screen.findByText('目前沒有本機物品')).toBeInTheDocument();
    expect(screen.getByText('物品', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /新增第一件物品/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /搜尋物品/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /查閱位置/ })).toBeInTheDocument();
  });
});
