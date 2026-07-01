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
  const isAdmin = canDeleteOrRestore(currentMember);

  function reload(): void {
    void loadItemDetail(householdId, itemId)
      .then((next) => { setDetail(next); setError(null); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : '無法載入物品'));
  }

  useEffect(() => {
    let active = true;
    void loadItemDetail(householdId, itemId)
      .then((next) => { if (active) { setDetail(next); setError(null); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : '無法載入物品'); });
    return () => { active = false; };
  }, [householdId, itemId]);

  const { item, locations, history } = detail;
  // Map location id -> display name so history/location never expose raw UUIDs.
  const locationName = useMemo(() => {
    const byId = new Map(locations.map((location) => [location.id, location.path || location.name]));
    return (id?: string | null) => (id ? byId.get(id) ?? '（已移除的位置）' : '—');
  }, [locations]);

  async function handleDelete() {
    if (!window.confirm('確定要刪除此物品嗎？30 天內可在清單中還原。')) return;
    try { await softDeleteItem({ householdId, itemId, actorId: userId, deviceId, member: currentMember }); show('已刪除物品（30 天內可還原）'); window.history.pushState({}, '', toHref('/')); window.dispatchEvent(new PopStateEvent('popstate')); }
    catch (cause) { show(cause instanceof Error ? cause.message : '刪除失敗', 'error'); }
  }

  async function handleRestore() {
    try { await restoreItem({ householdId, itemId, actorId: userId, deviceId, member: currentMember }); show('已還原物品'); reload(); }
    catch (cause) { show(cause instanceof Error ? cause.message : '還原失敗', 'error'); }
  }

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!item) return <p className="text-sm text-slate-500">目前家庭找不到這筆物品。</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{item.name}</h2>
        <p className="text-sm text-slate-500">{item.category} · {itemStatusLabels[item.status]}</p>
        <p className="mt-2 text-sm text-slate-700">目前位置：<span className="font-medium">{locationName(item.currentLocationId)}</span></p>
        {item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}
      </div>

      <PhotoGallery householdId={householdId} itemId={item.id} actorId={userId} deviceId={deviceId} coverPhotoId={item.coverPhotoId} onChanged={reload} />

      <MoveItemDialog householdId={householdId} itemId={item.id} currentLocationId={item.currentLocationId} actorId={userId} deviceId={deviceId} onMoved={reload} />

      {isAdmin ? (
        item.status === 'deleted'
          ? <button type="button" onClick={() => void handleRestore()} className="w-full rounded-2xl border border-teal-300 px-4 py-2 text-sm font-semibold text-teal-700">還原物品</button>
          : <button type="button" onClick={() => void handleDelete()} className="w-full rounded-2xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700">刪除物品</button>
      ) : null}

      <section>
        <h3 className="font-semibold text-slate-900">歷史紀錄</h3>
        <ol className="mt-2 space-y-2">
          {history.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-slate-200 p-3 text-sm">
              <p className="font-medium text-slate-800">{formatHistoryAction(entry)}</p>
              <p className="text-xs text-slate-500">{new Date(entry.occurredAt).toLocaleString('zh-TW')}</p>
              {entry.fromLocationId || entry.toLocationId ? <p className="text-xs text-slate-600">{locationName(entry.fromLocationId)} → {locationName(entry.toLocationId)}</p> : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
