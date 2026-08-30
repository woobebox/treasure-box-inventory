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
import { ActionLink, Button } from '../../components/ui';
import { EmptyState, ErrorState, LoadingState } from '../../components/StatusState';

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

export function TrashPage() {
  const { householdId, userId, deviceId, currentMember } = useHousehold();
  const { show } = useToast();
  const [rows, setRows] = useState<DeletedRow[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchRows(householdId).then((nextRows) => { setRows(nextRows); setError(null); setLoading(false); }).catch((cause: unknown) => { setError(cause instanceof Error ? cause.message : '無法載入已刪除物品'); setLoading(false); });
  }, [householdId]);

  useEffect(() => {
    let active = true;
    void fetchRows(householdId).then((nextRows) => {
      if (!active) return;
      setRows(nextRows);
      setError(null);
      setLoading(false);
    }).catch((cause: unknown) => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : '無法載入已刪除物品');
      setLoading(false);
    });
    return () => { active = false; };
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
    <div className="mx-auto max-w-5xl space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">資料保留</p><h2 className="mt-1 text-2xl font-bold text-slate-900">已刪除物品</h2><p className="mt-1 text-sm text-slate-600">刪除後 30 天內可以還原，逾期會永久移除。</p></div>
      <ActionLink href={toHref('/settings')} variant="ghost" leadingIcon={<ArrowLeft aria-hidden="true" className="h-4 w-4" />}>返回設定</ActionLink>

      {loading ? <LoadingState label="正在載入已刪除物品…" rows={2} /> : null}
      {!loading && error ? <ErrorState title="無法載入已刪除物品" message={error} actionLabel="重試" onAction={refresh} /> : null}
      {!loading && !error && rows.length === 0 ? <EmptyState title="目前沒有已刪除的物品" message="刪除的物品會在這裡保留 30 天，期間可由管理者還原。" /> : null}
      {!loading && !error && rows.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map(({ item, locationPath, daysLeft, expired }) => (
            <li key={item.id} className="flex min-h-28 items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{item.name}</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {item.category}
                  {locationPath ? ` · ${locationPath}` : ''}
                </p>
                <p className="mt-0.5 text-xs">
                  {expired
                    ? <span className="font-medium text-rose-700">已逾期，無法還原</span>
                    : <span className="font-medium text-amber-800">剩 {daysLeft} 天可還原</span>}
                </p>
              </div>
              {isAdmin && !expired && (
                <Button type="button" variant="secondary" busy={restoring === item.id} onClick={() => void handleRestore(item.id)} leadingIcon={<RotateCcw aria-hidden="true" className="h-4 w-4" />}>還原</Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
