import { useCallback, useEffect, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import type { Item } from '../../domain/types';
import { listDeletedItemsByHousehold } from '../../db/itemRepository';
import { listLocationsByHousehold } from '../../db/locationRepository';
import { restoreItem } from '../items/deleteRestoreItem';
import { isWithinSoftDeleteRetention } from '../../domain/retention';
import { useHousehold } from '../../services/householdContextValue';
import { useToast } from '../../components/toast/toastContext';

interface DeletedRow { item: Item; locationPath: string | null; daysLeft: number | null; expired: boolean; }

function daysRemaining(deletedAt: string): number {
  return Math.max(0, 30 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86_400_000));
}

async function fetchRows(householdId: string): Promise<DeletedRow[]> {
  const [items, locations] = await Promise.all([
    listDeletedItemsByHousehold(householdId),
    listLocationsByHousehold(householdId),
  ]);
  const pathById = new Map(locations.map((l) => [l.id, l.path]));
  return items.map((item) => ({
    item,
    locationPath: item.currentLocationId ? (pathById.get(item.currentLocationId) ?? null) : null,
    daysLeft: item.deletedAt ? daysRemaining(item.deletedAt) : null,
    expired: item.deletedAt ? !isWithinSoftDeleteRetention(item.deletedAt) : true,
  }));
}

export function TrashSettings() {
  const { householdId, userId, deviceId, currentMember } = useHousehold();
  const { show } = useToast();
  const [rows, setRows] = useState<DeletedRow[]>([]);
  const [open, setOpen] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchRows(householdId).then(setRows).catch(() => undefined);
  }, [open, householdId]);

  const refresh = useCallback(() => {
    fetchRows(householdId).then(setRows).catch(() => undefined);
  }, [householdId]);

  async function handleRestore(itemId: string) {
    setRestoring(itemId);
    try {
      await restoreItem({ householdId, itemId, actorId: userId, deviceId, member: currentMember });
      show('已還原物品');
      refresh();
    } catch (error) {
      show(error instanceof Error ? error.message : '還原失敗', 'error');
    } finally {
      setRestoring(null);
    }
  }

  const isAdmin = currentMember?.role === 'admin';

  return (
    <section className="rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Trash2 className="h-4 w-4 text-slate-500" />已刪除物品</h3>
          <p className="text-xs text-slate-500 mt-0.5">刪除後 30 天內可還原，逾期永久移除。</p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700">
          {open ? '收合' : '查看'}
        </button>
      </div>

      {open && (
        rows.length === 0
          ? <p className="text-sm text-slate-500">目前沒有已刪除的物品。</p>
          : <ul className="space-y-2">
            {rows.map(({ item, locationPath, daysLeft, expired }) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.category}
                    {locationPath ? ` · ${locationPath}` : ''}
                    {expired
                      ? <span className="ml-1 text-rose-500"> · 已逾期</span>
                      : <span className="ml-1 text-amber-600"> · 剩 {daysLeft} 天</span>}
                  </p>
                </div>
                {isAdmin && !expired && (
                  <button
                    type="button"
                    disabled={restoring === item.id}
                    onClick={() => void handleRestore(item.id)}
                    aria-label={`還原「${item.name}」`}
                    className="shrink-0 flex items-center gap-1 rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {restoring === item.id ? '還原中…' : '還原'}
                  </button>
                )}
              </li>
            ))}
          </ul>
      )}
    </section>
  );
}
