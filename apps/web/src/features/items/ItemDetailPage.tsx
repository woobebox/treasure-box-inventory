import { useEffect, useMemo, useState } from 'react';
import { getItemById } from '../../db/itemRepository';
import { listItemHistory } from '../../db/historyRepository';
import { listLocationsByHousehold } from '../../db/locationRepository';
import type { HistoryEntry, Item, Location } from '../../domain/types';
import { formatHistoryAction, itemStatusLabels } from '../../domain/labels';
import { MoveItemDialog } from './MoveItemDialog';
import { PhotoGallery } from './PhotoGallery';
import { softDeleteItem, restoreItem } from './deleteRestoreItem';
import { useHousehold } from '../../services/householdContextValue';
import { useToast } from '../../components/toast/toastContext';
import { canDeleteOrRestore } from '../../services/authorization';
import { toHref } from '../../app/basePath';
import { Button, ConfirmDialog } from '../../components/ui';
import { EmptyState, ErrorState, LoadingState } from '../../components/StatusState';

interface Props { itemId: string; }
interface ItemDetailState { item: Item | null; locations: Location[]; history: HistoryEntry[]; }

async function loadItemDetail(householdId: string, itemId: string): Promise<ItemDetailState> {
  const [found, locations, history] = await Promise.all([
    getItemById(householdId, itemId),
    listLocationsByHousehold(householdId),
    listItemHistory(householdId, itemId)
  ]);
  return { item: found ?? null, locations, history };
}

export function ItemDetailPage({ itemId }: Props) {
  const { householdId, userId, deviceId, currentMember } = useHousehold();
  const { show } = useToast();
  const [detail, setDetail] = useState<ItemDetailState>({ item: null, locations: [], history: [] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isAdmin = canDeleteOrRestore(currentMember);

  function reload(): void {
    void loadItemDetail(householdId, itemId)
      .then((next) => { setDetail(next); setError(null); setLoading(false); })
      .catch((cause) => { setError(cause instanceof Error ? cause.message : '無法載入物品'); setLoading(false); });
  }

  useEffect(() => {
    let active = true;
    void loadItemDetail(householdId, itemId)
      .then((next) => { if (active) { setDetail(next); setError(null); setLoading(false); } })
      .catch((cause) => { if (active) { setError(cause instanceof Error ? cause.message : '無法載入物品'); setLoading(false); } });
    return () => { active = false; };
  }, [householdId, itemId]);

  const { item, locations, history } = detail;
  // Map location id -> display name so history/location never expose raw UUIDs.
  const locationName = useMemo(() => {
    const byId = new Map(locations.map((location) => [location.id, location.path || location.name]));
    return (id?: string | null) => (id ? byId.get(id) ?? '（已移除的位置）' : '—');
  }, [locations]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await softDeleteItem({ householdId, itemId, actorId: userId, deviceId, member: currentMember });
      show('已刪除物品（30 天內可還原）');
      const fromPath = typeof window.history.state?.fromPath === 'string' ? window.history.state.fromPath : '';
      const canReturnInApp = fromPath === '/' || fromPath === '/search' || fromPath === '/locations' || fromPath.startsWith('/locations/');
      if (canReturnInApp) window.history.back();
      else {
        window.history.replaceState({}, '', toHref('/'));
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
    catch (cause) { show(cause instanceof Error ? cause.message : '刪除失敗', 'error'); }
    finally { setDeleting(false); setDeleteOpen(false); }
  }

  async function handleRestore() {
    try { await restoreItem({ householdId, itemId, actorId: userId, deviceId, member: currentMember }); show('已還原物品'); reload(); }
    catch (cause) { show(cause instanceof Error ? cause.message : '還原失敗', 'error'); }
  }

  if (loading) return <LoadingState label="正在載入物品詳情…" rows={4} />;
  if (error) return <ErrorState title="無法載入物品" message={error} actionLabel="重試" onAction={() => { setLoading(true); reload(); }} />;
  if (!item) return <EmptyState title="找不到這筆物品" message="這筆物品可能已被移除，或不屬於目前家庭。" />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="page-section bg-gradient-to-br from-white to-teal-50/60">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">物品詳情</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{item.name}</h2>
        <p className="mt-2 text-sm text-slate-600">{item.category} · {itemStatusLabels[item.status]}</p>
        <p className="mt-2 text-sm text-slate-700">目前位置：<span className="font-semibold text-teal-800">{locationName(item.currentLocationId)}</span></p>
        {item.notes ? <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm leading-6 text-slate-600">{item.notes}</p> : null}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <PhotoGallery householdId={householdId} itemId={item.id} itemName={item.name} actorId={userId} deviceId={deviceId} coverPhotoId={item.coverPhotoId} onChanged={reload} />

        <MoveItemDialog householdId={householdId} itemId={item.id} currentLocationId={item.currentLocationId} actorId={userId} deviceId={deviceId} onMoved={reload} />
      </div>

      {isAdmin ? (
        item.status === 'deleted'
          ? <Button type="button" variant="secondary" fullWidth onClick={() => void handleRestore()}>還原物品</Button>
          : <Button type="button" variant="danger" fullWidth onClick={() => setDeleteOpen(true)}>刪除物品</Button>
      ) : null}

      <section>
        <h3 className="font-semibold text-slate-900">歷史紀錄</h3>
        <ol className="mt-2 space-y-2">
          {history.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-slate-200 p-3 text-sm">
              <p className="font-medium text-slate-800">{formatHistoryAction(entry)}</p>
              <p className="text-xs text-slate-600">{new Date(entry.occurredAt).toLocaleString('zh-TW')}</p>
              {entry.fromLocationId || entry.toLocationId ? <p className="text-xs text-slate-600">{locationName(entry.fromLocationId)} → {locationName(entry.toLocationId)}</p> : null}
            </li>
          ))}
        </ol>
        {history.length === 0 ? <p className="mt-2 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">尚無歷史紀錄。</p> : null}
      </section>
      <ConfirmDialog open={deleteOpen} title={`刪除「${item.name}」？`} description="刪除後 30 天內可在已刪除物品中還原。" confirmLabel="確認刪除" busy={deleting} onCancel={() => setDeleteOpen(false)} onConfirm={() => void handleDelete()} />
    </div>
  );
}
