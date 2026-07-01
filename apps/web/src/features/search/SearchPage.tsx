import { useEffect, useState } from 'react';
import { db } from '../../db/database';
import { listItemsByHousehold } from '../../db/itemRepository';
import { listLocationsByHousehold } from '../../db/locationRepository';
import { listCategoryOptions } from '../../db/optionRepository';
import type { Location, Tag } from '../../domain/types';
import { SearchFilters } from './SearchFilters';
import { searchItems, type SearchFilters as FilterState, type SearchResult } from './searchService';
import { useHousehold } from '../../services/householdContextValue';
import { ItemCard } from '../items/ItemCard';

export function SearchPage() {
  const { householdId } = useHousehold();
  const [filters, setFilters] = useState<FilterState>({ status: 'all' }); const [results, setResults] = useState<SearchResult[]>([]); const [categories, setCategories] = useState<{ name: string; count: number }[]>([]); const [locations, setLocations] = useState<Location[]>([]); const [tags, setTags] = useState<Tag[]>([]);
  useEffect(() => { void Promise.all([listItemsByHousehold(householdId), listLocationsByHousehold(householdId), db.tags.where('householdId').equals(householdId).toArray(), listCategoryOptions(householdId)]).then(([items, locationRows, tagRows, categoryOptions]) => {
    // Count active items per category so chips can show (n); options with no items are hidden by SearchFilters.
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    const names = [...new Set([...categoryOptions, ...items.map((item) => item.category)])].sort();
    setCategories(names.map((name) => ({ name, count: counts.get(name) ?? 0 })));
    setLocations(locationRows); setTags(tagRows);
  }); }, [householdId]);
  useEffect(() => { void searchItems(householdId, filters).then(setResults); }, [householdId, filters]);
  return <div className="space-y-4"><SearchFilters value={filters} onChange={setFilters} categories={categories} locations={locations.map(({ id, path }) => ({ id, path }))} tags={tags.map(({ id, name }) => ({ id, name }))} /><p className="text-sm text-slate-500">找到 {results.length} 筆本機結果</p><ul className="space-y-2">{results.map(({ item, location, tags: itemTags }) => <li key={item.id}><ItemCard item={item} locationPath={location?.path} tagNames={itemTags.map((tag) => tag.name)} /></li>)}</ul></div>;
}
