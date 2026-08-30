import { ChevronRight, Trash2 } from 'lucide-react';
import { toHref } from '../../app/basePath';

export function TrashSettings() {
  return (
    <section className="page-section">
      <a href={toHref('/trash')} className="group flex min-h-12 items-center justify-between gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-800 group-hover:text-teal-800">
            <Trash2 aria-hidden="true" className="h-5 w-5 text-slate-500" />已刪除物品
          </h3>
          <p className="mt-0.5 text-xs text-slate-600">刪除後 30 天內可還原，逾期永久移除。</p>
        </div>
        <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-600" />
      </a>
    </section>
  );
}
