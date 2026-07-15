import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import type { Item, Location } from '../domain/types';

const householdId = 'hh-locdetail';

vi.mock('../services/householdContextValue', () => ({
  useHousehold: () => ({ householdId: 'hh-locdetail', householdName: '測試家庭', userId: 'user-1', deviceId: 'device-1' }),
}));

const { LocationDetailPage } = await import('../features/locations/LocationDetailPage');
const { AddItemPage } = await import('../features/items/AddItemPage');

const at = '2026-07-14T08:00:00.000Z';

function makeLocation(id: string, name: string, parentId: string | null, path: string): Location {
  return { id, householdId, parentId, type: 'cabinet', name, path, sortOrder: 0, version: 1, createdAt: at, updatedAt: at, deletedAt: null };
}

function makeItem(id: string, name: string, locationId: string, deletedAt: string | null = null): Item {
  return {
    id, householdId, createdBy: 'user-1', updatedBy: 'user-1', currentLocationId: locationId,
    coverPhotoId: null, name, normalizedName: name, category: '雜物', status: deletedAt ? 'deleted' : 'active',
    version: 1, createdAt: at, updatedAt: at, deletedAt,
  };
}

const root = makeLocation('loc-root', '儲藏室', null, '儲藏室');
const box = makeLocation('loc-box', '箱子A', 'loc-root', '儲藏室 / 箱子A');
const empty = makeLocation('loc-empty', '空櫃', null, '空櫃');

describe('location detail page', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await db.locations.bulkPut([root, box, empty]);
    await db.items.bulkPut([
      makeItem('item-direct', '直屬電鑽', 'loc-root'),
      makeItem('item-nested', '子箱膠帶', 'loc-box'),
      makeItem('item-deleted', '已刪舊物', 'loc-root', at),
    ]);
    window.history.replaceState({}, '', '/');
  });

  it('lists direct and descendant items and hides deleted ones', async () => {
    render(<LocationDetailPage locationId="loc-root" />);

    await waitFor(() => expect(screen.getByRole('heading', { name: '儲藏室' })).toBeInTheDocument());
    expect(screen.getByText('含子位置共 2 件物品')).toBeInTheDocument();
    expect(screen.getByText('直屬電鑽')).toBeInTheDocument();
    expect(screen.getByText('子箱膠帶')).toBeInTheDocument();
    expect(screen.queryByText('已刪舊物')).not.toBeInTheDocument();
    // 子位置物品可辨識實際所在位置
    expect(screen.getByText(/儲藏室 \/ 箱子A/)).toBeInTheDocument();
  });

  it('shows the empty state with an add-here entry', async () => {
    render(<LocationDetailPage locationId="loc-empty" />);

    await waitFor(() => expect(screen.getByText(/這個位置還沒有物品/)).toBeInTheDocument());
    const addLink = screen.getByRole('link', { name: /在此位置新增物品/ });
    expect(addLink.getAttribute('href')).toContain('locationId=loc-empty');
  });

  it('shows a not-found notice for a missing location', async () => {
    render(<LocationDetailPage locationId="loc-gone" />);

    await waitFor(() => expect(screen.getByText(/找不到這個位置/)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: '回位置管理' })).toBeInTheDocument();
  });

  it('preselects the location on the add page via ?locationId=', async () => {
    window.history.replaceState({}, '', '/add?locationId=loc-box');
    render(<AddItemPage />);

    await waitFor(() => expect(screen.getByRole('combobox', { name: /位置/ })).toHaveValue('loc-box'));
  });

  it('ignores an unknown ?locationId= on the add page', async () => {
    window.history.replaceState({}, '', '/add?locationId=loc-unknown');
    render(<AddItemPage />);

    await waitFor(() => expect(screen.getByRole('combobox', { name: /位置/ })).toHaveValue(''));
  });
});
