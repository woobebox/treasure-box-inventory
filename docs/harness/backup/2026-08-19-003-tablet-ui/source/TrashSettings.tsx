import { ChevronRight, Trash2 } from 'lucide-react';
import { toHref } from '../../app/basePath';

export function TrashSettings() {
  return (
    <section className="rounded-2xl border border-slate-200 p-4">
      <a
        href={toHref('/trash')}
        className="flex items-center justify-between gap-3"
      >
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-slate-500" />已刪除物品
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">刪除後 30 天內可還原，逾期永久移除。</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
      </a>
    </section>
  );
}
