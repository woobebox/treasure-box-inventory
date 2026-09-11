import { describe, expect, it } from 'vitest';
import { parseSearchFilters, serializeSearchFilters } from '../features/search/searchUrlState';

describe('search URL state', () => {
  it('round-trips supported filters and omits defaults', () => {
    const query = serializeSearchFilters({ query: ' 相機 ', category: '電子', locationId: 'loc-1', status: 'active', tagIds: ['tag-1'], createdFrom: '2026-08-01', createdTo: '2026-08-27' });
    expect(parseSearchFilters(query)).toEqual({ query: '相機', category: '電子', locationId: 'loc-1', status: 'active', tagIds: ['tag-1'], createdFrom: '2026-08-01', createdTo: '2026-08-27' });
    expect(serializeSearchFilters({ status: 'all' })).toBe('');
  });

  it('rejects unknown status values', () => {
    expect(parseSearchFilters('?status=owner&q=test')).toMatchObject({ query: 'test', status: 'all' });
  });

  it('preserves non-default sorting and view while omitting defaults', () => {
    expect(parseSearchFilters('?sort=name-asc&view=list')).toMatchObject({ sort: 'name-asc', view: 'list' });
    expect(serializeSearchFilters({ sort: 'updated-desc', view: 'grid' })).toBe('');
  });
});
