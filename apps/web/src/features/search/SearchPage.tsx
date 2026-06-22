import { useEffect, useState } from 'react';
import { db } from '../../db/database';
import { listItemsByHousehold } from '../../db/itemRepository';
import { listLocationsByHousehold } from '../../db/locationRepository';
import type { Location, Tag } from '../../domain/types';
import { SearchFilters } from './SearchFilters';
import { searchItems, type SearchFilters as FilterState, type SearchResult } from './searchService';

const demoHouseholdId = 'local-demo-household';
export function SearchPage() {
  const [filters, setFilters] = useState<FilterState>({ status: 'all' }); const [results, setResults] = useState<SearchResult[]>([]); const [categories, setCategories] = useState<string[]>([]); const [locations, setLocations] = useState<Location[]>([]); const [tags, setTags] = useState<Tag[]>([]);
  useEffect(() => { void Promise.all([listItemsByHousehold(demoHouseholdId), listLocationsByHousehold(demoHouseholdId), db.tags.where('householdId').equals(demoHouseholdId).toArray()]).then(([items, locationRows, tagRows]) => { setCategories([...new Set(items.map((item) => item.category))].sort()); setLocations(locationRows); setTags(tagRows); }); }, []);
  useEffect(() => { void searchItems(demoHouseholdId, filters).then(setResults); }, [filters]);
  return <div className="space-y-4"><SearchFilters value={filters} onChange={setFilters} categories={categories} locations={locations.map(({ id, path }) => ({ id, path }))} tags={tags.map(({ id, name }) => ({ id, name }))} /><p className="text-sm text-slate-500">{results.length} local results</p><ul className="space-y-2">{results.map(({ item, location, tags: itemTags }) => <li key={item.id} className="rounded-2xl border border-slate-200 p-3"><h3 className="font-semibold text-slate-900">{item.name}</h3><p className="text-xs text-slate-500">{item.category} · {item.status} · {location?.path ?? 'No location'}</p><p className="text-xs text-teal-700">{itemTags.map((tag) => `#${tag.name}`).join(' ')}</p></li>)}</ul></div>;
}
