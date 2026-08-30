import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { ItemStatus } from '../../domain/types';
import { itemStatusLabels } from '../../domain/labels';
import type { SearchFilters as Filters } from './searchService';
import { Button } from '../../components/ui';

interface Props { value: Filters; onChange: (value: Filters) => void; categories: { name: string; count: number }[]; locations: { id: string; path: string }[]; tags: { id: string; name: string }[]; busy?: boolean; }
const statuses: Array<ItemStatus | 'all'> = ['all', 'active', 'archived', 'deleted'];

// Count of advanced (non-query, non-category) filters in use, for the badge.
function advancedCount(value: Filters): number {
  let n = 0;
  if (value.locationId) n++;
  if (value.status && value.status !== 'all') n++;
  if (value.tagIds?.length) n++;
  if (value.createdFrom) n++;
  if (value.createdTo) n++;
  return n;
}

export function SearchFilters({ value, onChange, categories, locations, tags, busy = false }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const activeAdvanced = advancedCount(value);

  return (
    <div className="space-y-3" aria-busy={busy}>
      {/* Compact layer sticks below the app bar so search + category switching
          stay reachable while scrolling results. */}
      <div className="sticky top-[58px] z-20 -mx-1 space-y-2 rounded-2xl bg-[var(--ui-bg)] px-1 pb-2 pt-1 md:static md:rounded-none">
        <label className="sr-only" htmlFor="inventory-search">搜尋關鍵字</label>
        <input id="inventory-search" type="search" value={value.query ?? ''} onChange={(event) => onChange({ ...value, query: event.target.value })} placeholder="搜尋名稱、分類、標籤、位置" className="field-control w-full" />
        {categories.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button type="button" aria-pressed={!value.category} onClick={() => onChange({ ...value, category: undefined })} className={`min-h-11 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${!value.category ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-teal-50'}`}>全部</button>
            {categories.filter((category) => category.count > 0).map((category) => {
              const selected = value.category === category.name;
              return <button key={category.name} type="button" aria-pressed={selected} onClick={() => onChange({ ...value, category: selected ? undefined : category.name })} className={`min-h-11 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${selected ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-teal-50'}`}>{category.name}（{category.count}）</button>;
            })}
          </div>
        ) : null}
      </div>
      <Button type="button" variant="ghost" size="md" aria-expanded={advancedOpen} aria-controls="advanced-search-filters" leadingIcon={<SlidersHorizontal aria-hidden="true" className="h-4 w-4" />} onClick={() => setAdvancedOpen((open) => !open)}>進階篩選{activeAdvanced > 0 ? <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-800">{activeAdvanced}</span> : null}</Button>

      {/* Advanced panel: slides in on demand, collapsed by default */}
      {advancedOpen ? (
        <div id="advanced-search-filters" className="reveal-panel grid gap-3 rounded-3xl border border-teal-100 bg-white p-4 shadow-sm md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">位置<select value={value.locationId ?? ''} onChange={(event) => onChange({ ...value, locationId: event.target.value || undefined })} className="field-control mt-1 w-full font-normal"><option value="">全部位置</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.path}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">狀態<select value={value.status ?? 'all'} onChange={(event) => onChange({ ...value, status: event.target.value as ItemStatus | 'all' })} className="field-control mt-1 w-full font-normal">{statuses.map((status) => <option key={status} value={status}>{status === 'all' ? '全部狀態' : itemStatusLabels[status]}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">標籤<select value={value.tagIds?.[0] ?? ''} onChange={(event) => onChange({ ...value, tagIds: event.target.value ? [event.target.value] : [] })} className="field-control mt-1 w-full font-normal"><option value="">全部標籤</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label>
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-700">建立日期</p>
            <div className="grid grid-cols-2 gap-2">
              <input aria-label="建立日期起" type="date" value={value.createdFrom ?? ''} onChange={(event) => onChange({ ...value, createdFrom: event.target.value || undefined })} className="field-control w-full" />
              <input aria-label="建立日期迄" type="date" value={value.createdTo ?? ''} onChange={(event) => onChange({ ...value, createdTo: event.target.value || undefined })} className="field-control w-full" />
            </div>
          </div>
          {activeAdvanced > 0 ? <button type="button" onClick={() => onChange({ query: value.query, category: value.category, status: 'all' })} className="min-h-11 cursor-pointer rounded-xl px-3 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">清除進階篩選</button> : null}
        </div>
      ) : null}
    </div>
  );
}
