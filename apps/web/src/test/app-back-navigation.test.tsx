import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import type { Location } from '../domain/types';

vi.mock('../services/supabaseClient', () => ({ supabase: null }));
vi.mock('../services/authContext', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));
vi.mock('../services/householdContextValue', () => ({
  useHousehold: () => ({ householdId: 'hh-nav', householdName: '導覽家庭', userId: 'u1', deviceId: 'd1', currentMember: undefined }),
}));

const { App } = await import('../app/App');

const at = '2026-07-14T08:00:00.000Z';
const location: Location = {
  id: 'loc-nav', householdId: 'hh-nav', parentId: null, type: 'cabinet', name: '導覽測試櫃', path: '導覽測試櫃',
  sortOrder: 0, version: 1, createdAt: at, updatedAt: at, deletedAt: null,
};

describe('app back navigation', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    window.history.replaceState({}, '', '/');
  });

  it('hides the back button on top-level routes', () => {
    render(<App />);
    expect(screen.queryByLabelText('返回')).not.toBeInTheDocument();
  });

  it('shows the back button on the item detail route', () => {
    window.history.replaceState({}, '', '/items/item-x');
    render(<App />);
    expect(screen.getByLabelText('返回')).toBeInTheDocument();
  });

  it('falls back to the parent page when opened without in-app history', async () => {
    window.history.replaceState({}, '', '/locations/loc-x');
    render(<App />);
    expect(screen.getByRole('heading', { name: '位置詳情' })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('返回'));
    await waitFor(() => expect(screen.getByRole('heading', { name: '位置管理' })).toBeInTheDocument());
    expect(screen.queryByLabelText('返回')).not.toBeInTheDocument();
  });

  it('goes back to the previous page after in-app navigation', async () => {
    await db.locations.put(location);
    window.history.replaceState({}, '', '/locations');
    render(<App />);

    const link = await screen.findByRole('link', { name: '導覽測試櫃' });
    fireEvent.click(link);
    await waitFor(() => expect(screen.getByRole('heading', { name: '位置詳情' })).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('返回'));
    await waitFor(() => expect(screen.getByRole('heading', { name: '位置管理' })).toBeInTheDocument());
  });
});
