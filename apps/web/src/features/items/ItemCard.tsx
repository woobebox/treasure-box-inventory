import { Package } from 'lucide-react';
import type { Item } from '../../domain/types';
import { itemStatusLabels } from '../../domain/labels';
import { useCoverThumbnail } from './useCoverThumbnail';
import { toHref } from '../../app/basePath';

interface ItemCardProps {
  item: Item;
  locationPath?: string | null;
  tagNames?: string[];
}

// Shared list card: cover thumbnail (or placeholder) + name, category chip,
// location, tags, and the created date.
export function ItemCard({ item, locationPath, tagNames = [] }: ItemCardProps) {
  const thumbnail = useCoverThumbnail(item.coverPhotoId);
  const created = new Date(item.createdAt).toLocaleDateString('zh-TW');
  return (
    <a href={toHref(`/items/${item.id}`)} className="interactive-card group flex min-h-24 gap-4 rounded-2xl border border-slate-200 bg-white p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
        {thumbnail ? <img src={thumbnail} alt={item.name} className="h-full w-full object-cover" /> : <Package aria-hidden="true" className="h-6 w-6 text-slate-400" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-teal-800">{item.name}</h3>
          <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">{item.category || '未分類'}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-600">{itemStatusLabels[item.status]} · {locationPath ?? '未設定位置'}</p>
        {tagNames.length > 0 ? <p className="mt-0.5 truncate text-xs text-teal-700">{tagNames.map((name) => `#${name}`).join(' ')}</p> : null}
        <p className="mt-0.5 text-xs text-slate-600">新增於 {created}</p>
      </div>
    </a>
  );
}
