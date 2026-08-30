import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { db } from '../../db/database';
import { listItemsByHousehold } from '../../db/itemRepository';
import { listLocationsByHousehold } from '../../db/locationRepository';
import { listCategoryOptions } from '../../db/optionRepository';
import type { Location, Tag } from '../../domain/types';
import { ErrorState, LoadingState } from '../../components/StatusState';
import { Button } from '../../components/ui';
import { SearchFilters } from './SearchFilters';
import { searchItems, type SearchFilters as FilterState, type SearchResult } from './searchService';
import { useHousehold } from '../../services/householdContextValue';
import { ItemCard } from '../items/ItemCard';
import { parseSearchFilters, serializeSearchFilters } from './searchUrlState';

function hasActiveFilters(filters: FilterState): boolean {
  return Boolean(filters.query?.trim() || filters.category || filters.locationId || (filters.status && filters.status !== 'all') || filters.tagIds?.length || filters.createdFrom || filters.createdTo);
}

export function SearchPage() {
  const { householdId } = useHousehold();
  const [filters, setFilters] = useState<FilterState>(() => parseSearchFilters(window.location.search));
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryRevision, setRetryRevision] = useState(0);
  const requestId = useRef(0);
  const restoreScroll = useRef(typeof window.history.state?.scrollY === 'number' && window.history.state.scrollY > 0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedFilters(filters), 250);
    return () => window.clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    const query = serializeSearchFilters(filters);
    window.history.replaceState(window.history.state ?? {}, '', `${window.location.pathname}${query}`);
  }, [filters]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      listItemsByHousehold(householdId),
      listLocationsByHousehold(householdId),
      db.tags.where('householdId').equals(householdId).toArray(),
      listCategoryOptions(householdId),
    ]).then(([items, locationRows, tagRows, categoryOptions]) => {
      if (!active) return;
      const counts = new Map<string, number>();
      for (const item of items) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
      const names = [...new Set([...categoryOptions, ...items.map((item) => item.category)])].sort();
      setCategories(names.map((name) => ({ name, count: counts.get(name) ?? 0 })));
      setLocations(locationRows);
      setTags(tagRows);
      setMetadataLoading(false);
    }).catch((cause: unknown) => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : '無法載入搜尋條件');
      setMetadataLoading(false);
    });
    return () => { active = false; };
  }, [householdId, retryRevision]);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    void searchItems(householdId, debouncedFilters).then((nextResults) => {
      if (currentRequest !== requestId.current) return;
      setResults(nextResults);
      setResultsLoading(false);
      if (restoreScroll.current) {
        restoreScroll.current = false;
        const top = Number(window.history.state?.scrollY) || 0;
        window.requestAnimationFrame(() => window.scrollTo({ top }));
      }
    }).catch((cause: unknown) => {
      if (currentRequest !== requestId.current) return;
      setError(cause instanceof Error ? cause.message : '搜尋失敗');
      setResultsLoading(false);
    });
  }, [householdId, debouncedFilters, retryRevision]);

  const activeFilters = hasActiveFilters(filters);
  function updateFilters(next: FilterState) {
    setFilters(next);
    setResultsLoading(true);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">家庭資料庫</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">搜尋物品</h2>
        <p className="mt-1 text-sm text-slate-600">用名稱、分類、標籤或位置找到你要的東西。</p>
      </div>

      <SearchFilters value={filters} onChange={updateFilters} categories={categories} locations={locations.map(({ id, path }) => ({ id, path }))} tags={tags.map(({ id, name }) => ({ id, name }))} busy={metadataLoading || resultsLoading} />

      {error ? <ErrorState title="無法完成搜尋" message={error} actionLabel="重試" onAction={() => { setMetadataLoading(true); setResultsLoading(true); setError(null); setRetryRevision((value) => value + 1); }} /> : null}
      {!error ? <p aria-live="polite" className="text-sm font-medium text-slate-600">{resultsLoading ? '正在搜尋本機物品…' : `找到 ${results.length} 筆本機結果`}</p> : null}
      {!error && resultsLoading && results.length === 0 ? <LoadingState label="正在搜尋本機物品…" rows={2} /> : null}
      {!error && results.length > 0 ? (
        <ul className={`grid gap-3 md:grid-cols-2 md:gap-4 ${resultsLoading ? 'opacity-60' : ''}`} aria-busy={resultsLoading}>
          {results.map(({ item, location, tags: itemTags }) => <li key={item.id}><ItemCard item={item} locationPath={location?.path} tagNames={itemTags.map((tag) => tag.name)} /></li>)}
        </ul>
      ) : null}
      {!error && !resultsLoading && results.length === 0 ? (
        <div className="page-section border-dashed text-center">
          <p className="text-sm font-semibold text-slate-800">沒有符合條件的物品</p>
          <p className="mt-1 text-sm text-slate-600">試著縮短關鍵字，或清除目前的篩選條件。</p>
          {activeFilters ? <Button type="button" variant="secondary" className="mt-4" leadingIcon={<RotateCcw aria-hidden="true" className="h-4 w-4" />} onClick={() => updateFilters({ status: 'all' })}>清除所有篩選</Button> : null}
        </div>
      ) : null}
    </div>
  );
}
