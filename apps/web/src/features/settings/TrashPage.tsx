import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import type { Item } from '../../domain/types';
import { listDeletedItemsByHousehold } from '../../db/itemRepository';
import { listLocationsByHousehold } from '../../db/locationRepository';
import { restoreItem } from '../items/deleteRestoreItem';
import { isWithinSoftDeleteRetention } from '../../domain/retention';
import { useHousehold } from '../../services/householdContextValue';
import { useToast } from '../../components/toast/toastContext';
import { toHref } from '../../app/basePath';

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

function navigate(path: string) {
  window.history.pushState({}, '', toHref(path));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function TrashPage() {
  const { householdId, userId, deviceId, currentMember } = useHousehold();
  const { show } = useToast();
  const [rows, setRows] = useState<DeletedRow[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetchRows(householdId).then(setRows).catch(() => undefined);
  }, [householdId]);

  useEffect(() => { refresh(); }, [refresh]);

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
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate('/settings')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-700"
      >
        <ArrowLeft className="h-4 w-4" />
        返回設定
      </button>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500">目前沒有已刪除的物品。</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ item, locationPath, daysLeft, expired }) => (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{item.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.category}
                  {locationPath ? ` · ${locationPath}` : ''}
                </p>
                <p className="mt-0.5 text-xs">
                  {expired
                    ? <span className="text-rose-500">已逾期，無法還原</span>
                    : <span className="text-amber-600">剩 {daysLeft} 天可還原</span>}
                </p>
              </div>
              {isAdmin && !expired && (
                <button
                  type="button"
                  disabled={restoring === item.id}
                  onClick={() => void handleRestore(item.id)}
                  aria-label={`還原「${item.name}」`}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl border border-teal-300 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  {restoring === item.id ? '還原中…' : '還原'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
