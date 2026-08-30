import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import type { Item } from '../domain/types';

const { searchItemsMock } = vi.hoisted(() => ({ searchItemsMock: vi.fn() }));

vi.mock('../services/householdContextValue', () => ({
  useHousehold: () => ({ householdId: 'hh-search' }),
}));

vi.mock('../features/search/searchService', async () => {
  const actual = await vi.importActual<typeof import('../features/search/searchService')>('../features/search/searchService');
  return { ...actual, searchItems: searchItemsMock };
});

const { SearchPage } = await import('../features/search/SearchPage');

const item: Item = {
  id: 'item-new', householdId: 'hh-search', createdBy: 'u1', updatedBy: 'u1', currentLocationId: 'loc-1', coverPhotoId: null,
  name: '新搜尋結果', normalizedName: '新搜尋結果', category: '電子', status: 'active', version: 1,
  createdAt: '2026-08-27T00:00:00.000Z', updatedAt: '2026-08-27T00:00:00.000Z', deletedAt: null,
};

describe('search page UX', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.useFakeTimers();
    window.history.replaceState({}, '', '/search');
    searchItemsMock.mockReset();
    searchItemsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces input and ignores an older result that resolves last', async () => {
    let resolveOld!: (value: unknown[]) => void;
    let resolveNew!: (value: unknown[]) => void;
    const oldResult = new Promise<unknown[]>((resolve) => { resolveOld = resolve; });
    const newResult = new Promise<unknown[]>((resolve) => { resolveNew = resolve; });
    searchItemsMock.mockImplementation((_householdId: string, filters: { query?: string }) => {
      if (filters.query === '舊') return oldResult;
      if (filters.query === '新') return newResult;
      return Promise.resolve([]);
    });

    render(<SearchPage />);
    await act(async () => { await vi.runAllTimersAsync(); });
    searchItemsMock.mockClear();

    const input = screen.getByRole('searchbox', { name: '搜尋關鍵字' });
    fireEvent.change(input, { target: { value: '舊' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(249); });
    expect(searchItemsMock).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(searchItemsMock).toHaveBeenLastCalledWith('hh-search', expect.objectContaining({ query: '舊' }));

    fireEvent.change(input, { target: { value: '新' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(250); });
    expect(window.location.search).toBe('?q=%E6%96%B0');

    await act(async () => { resolveNew([{ item, location: undefined, tags: [] }]); await Promise.resolve(); });
    expect(screen.getByText('新搜尋結果')).toBeInTheDocument();
    await act(async () => { resolveOld([]); await Promise.resolve(); });
    expect(screen.getByText('新搜尋結果')).toBeInTheDocument();
  });
});
