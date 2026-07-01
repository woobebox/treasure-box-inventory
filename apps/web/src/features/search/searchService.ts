import { db } from '../../db/database';
import { listItemsByHousehold } from '../../db/itemRepository';
import { listLocationsByHousehold } from '../../db/locationRepository';
import { collectDescendantLocationIds } from '../locations/locationTree';
import { indexItemText, textMatches } from './searchIndex';
import type { Item, ItemStatus, Location, Tag } from '../../domain/types';

export interface SearchFilters { query?: string; category?: string; tagIds?: string[]; locationId?: string; includeDescendants?: boolean; status?: ItemStatus | 'all'; createdFrom?: string; createdTo?: string; }
export interface SearchResult { item: Item; location?: Location; tags: Tag[]; }

export async function searchItems(householdId: string, filters: SearchFilters = {}): Promise<SearchResult[]> {
  const [items, locations, tags, itemTags] = await Promise.all([listItemsByHousehold(householdId), listLocationsByHousehold(householdId), db.tags.where('householdId').equals(householdId).filter((tag) => !tag.deletedAt).toArray(), db.itemTags.where('householdId').equals(householdId).toArray()]);
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const tagIdsByItem = new Map<string, Set<string>>();
  for (const row of itemTags) tagIdsByItem.set(row.itemId, new Set([...(tagIdsByItem.get(row.itemId) ?? []), row.tagId]));
  const allowedLocationIds = filters.locationId ? new Set(filters.includeDescendants === false ? [filters.locationId] : collectDescendantLocationIds(locations, filters.locationId)) : undefined;
  return items.filter((item) => {
    const itemTagIds = tagIdsByItem.get(item.id) ?? new Set<string>();
    const itemTagsForIndex = [...itemTagIds].map((id) => tagById.get(id)).filter((tag): tag is Tag => Boolean(tag));
    if (filters.category?.trim() && item.category.toLocaleLowerCase() !== filters.category.trim().toLocaleLowerCase()) return false;
    if (filters.status && filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.locationId && !allowedLocationIds?.has(item.currentLocationId)) return false;
    if (filters.tagIds?.length && !filters.tagIds.every((id) => itemTagIds.has(id))) return false;
    const createdDate = item.createdAt.slice(0, 10);
    if (filters.createdFrom && createdDate < filters.createdFrom) return false;
    if (filters.createdTo && createdDate > filters.createdTo) return false;
    return textMatches(indexItemText(item, itemTagsForIndex, locationById.get(item.currentLocationId)), filters.query ?? '');
  }).map((item) => ({ item, location: locationById.get(item.currentLocationId), tags: [...(tagIdsByItem.get(item.id) ?? [])].map((id) => tagById.get(id)).filter((tag): tag is Tag => Boolean(tag)) }));
}
