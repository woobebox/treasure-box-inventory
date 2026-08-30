import type { ItemStatus } from '../../domain/types';
import type { SearchFilters } from './searchService';

const validStatuses = new Set<ItemStatus>(['active', 'archived', 'deleted']);

export function parseSearchFilters(search: string): SearchFilters {
  const params = new URLSearchParams(search);
  const status = params.get('status');
  return {
    query: params.get('q') || undefined,
    category: params.get('category') || undefined,
    locationId: params.get('location') || undefined,
    status: status && validStatuses.has(status as ItemStatus) ? status as ItemStatus : 'all',
    tagIds: params.get('tag') ? [params.get('tag')!] : [],
    createdFrom: params.get('from') || undefined,
    createdTo: params.get('to') || undefined,
  };
}

export function serializeSearchFilters(filters: SearchFilters): string {
  const params = new URLSearchParams();
  if (filters.query?.trim()) params.set('q', filters.query.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.locationId) params.set('location', filters.locationId);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.tagIds?.[0]) params.set('tag', filters.tagIds[0]);
  if (filters.createdFrom) params.set('from', filters.createdFrom);
  if (filters.createdTo) params.set('to', filters.createdTo);
  const value = params.toString();
  return value ? `?${value}` : '';
}
