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
    <a href={toHref(`/items/${item.id}`)} className="interactive-card flex gap-3 rounded-2xl border border-slate-200 p-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
        {thumbnail ? <img src={thumbnail} alt={item.name} className="h-full w-full object-cover" /> : <Package className="h-6 w-6 text-slate-400" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-slate-900">{item.name}</h3>
          <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">{item.category || '未分類'}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">{itemStatusLabels[item.status]} · {locationPath ?? '未設定位置'}</p>
        {tagNames.length > 0 ? <p className="mt-0.5 truncate text-xs text-teal-700">{tagNames.map((name) => `#${name}`).join(' ')}</p> : null}
        <p className="mt-0.5 text-xs text-slate-400">新增於 {created}</p>
      </div>
    </a>
  );
}
