import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { ItemStatus } from '../../domain/types';
import { itemStatusLabels } from '../../domain/labels';
import type { SearchFilters as Filters } from './searchService';

interface Props { value: Filters; onChange: (value: Filters) => void; categories: { name: string; count: number }[]; locations: { id: string; path: string }[]; tags: { id: string; name: string }[]; }
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

export function SearchFilters({ value, onChange, categories, locations, tags }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const activeAdvanced = advancedCount(value);

  return (
    <div className="space-y-3">
      {/* Compact layer sticks below the app bar so search + category switching
          stay reachable while scrolling results. */}
      <div className="sticky top-[52px] z-20 -mx-1 space-y-2 bg-white px-1 pb-2 pt-1">
        <input aria-label="搜尋關鍵字" value={value.query ?? ''} onChange={(event) => onChange({ ...value, query: event.target.value })} placeholder="搜尋名稱、分類、標籤、位置" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
        {categories.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => onChange({ ...value, category: undefined })} className={`shrink-0 rounded-full px-3 py-1 text-sm ${!value.category ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'}`}>全部</button>
            {categories.filter((category) => category.count > 0).map((category) => {
              const selected = value.category === category.name;
              return <button key={category.name} type="button" onClick={() => onChange({ ...value, category: selected ? undefined : category.name })} className={`shrink-0 rounded-full px-3 py-1 text-sm ${selected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{category.name}（{category.count}）</button>;
            })}
          </div>
        ) : null}
      </div>
      <button type="button" onClick={() => setAdvancedOpen((open) => !open)} className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700">
        <SlidersHorizontal className="h-4 w-4" />進階篩選{activeAdvanced > 0 ? <span className="rounded-full bg-teal-100 px-1.5 text-xs text-teal-800">{activeAdvanced}</span> : null}
      </button>

      {/* Advanced panel: slides in on demand, collapsed by default */}
      {advancedOpen ? (
        <div className="reveal-panel grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <select aria-label="位置篩選" value={value.locationId ?? ''} onChange={(event) => onChange({ ...value, locationId: event.target.value || undefined })} className="rounded-xl border border-slate-300 px-3 py-2"><option value="">全部位置</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.path}</option>)}</select>
          <select aria-label="狀態篩選" value={value.status ?? 'all'} onChange={(event) => onChange({ ...value, status: event.target.value as ItemStatus | 'all' })} className="rounded-xl border border-slate-300 px-3 py-2">{statuses.map((status) => <option key={status} value={status}>{status === 'all' ? '全部狀態' : itemStatusLabels[status]}</option>)}</select>
          <select aria-label="標籤篩選" value={value.tagIds?.[0] ?? ''} onChange={(event) => onChange({ ...value, tagIds: event.target.value ? [event.target.value] : [] })} className="rounded-xl border border-slate-300 px-3 py-2"><option value="">全部標籤</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select>
          <div>
            <p className="mb-1 text-xs text-slate-500">建立日期</p>
            <div className="grid grid-cols-2 gap-2">
              <input aria-label="建立日期起" type="date" value={value.createdFrom ?? ''} onChange={(event) => onChange({ ...value, createdFrom: event.target.value || undefined })} className="rounded-xl border border-slate-300 px-3 py-2" />
              <input aria-label="建立日期迄" type="date" value={value.createdTo ?? ''} onChange={(event) => onChange({ ...value, createdTo: event.target.value || undefined })} className="rounded-xl border border-slate-300 px-3 py-2" />
            </div>
          </div>
          {activeAdvanced > 0 ? <button type="button" onClick={() => onChange({ query: value.query, category: value.category, status: 'all' })} className="text-left text-xs text-rose-500">清除進階篩選</button> : null}
        </div>
      ) : null}
    </div>
  );
}
