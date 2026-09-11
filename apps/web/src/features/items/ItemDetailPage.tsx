import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
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
import { Button, ConfirmDialog, FormField } from '../../components/ui';
import { EmptyState, ErrorState, LoadingState } from '../../components/StatusState';
import { listTagNamesForItem } from '../../db/tagRepository';
import { CategoryPicker } from '../categories/CategoryPicker';
import { TagPicker } from '../tags/TagPicker';
import { updateItemDetails } from './updateItemDetails';

interface Props { itemId: string; }
interface ItemDetailState { item: Item | null; locations: Location[]; history: HistoryEntry[]; tagNames: string[]; }

async function loadItemDetail(householdId: string, itemId: string): Promise<ItemDetailState> {
  const [found, locations, history, tagNames] = await Promise.all([
    getItemById(householdId, itemId),
    listLocationsByHousehold(householdId),
    listItemHistory(householdId, itemId),
    listTagNamesForItem(householdId, itemId),
  ]);
  return { item: found ?? null, locations, history, tagNames };
}

export function ItemDetailPage({ itemId }: Props) {
  const { householdId, userId, deviceId, currentMember } = useHousehold();
  const { show } = useToast();
  const [detail, setDetail] = useState<ItemDetailState>({ item: null, locations: [], history: [], tagNames: [] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editState, setEditState] = useState({ name: '', category: '', notes: '', tagNames: [] as string[] });
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

  const { item, locations, history, tagNames } = detail;
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

  function beginEdit(): void {
    if (!item) return;
    setEditState({ name: item.name, category: item.category, notes: item.notes ?? '', tagNames });
    setEditError('');
    setEditing(true);
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!item) return;
    setSavingEdit(true);
    setEditError('');
    try {
      await updateItemDetails({ householdId, itemId: item.id, actorId: userId, deviceId, ...editState });
      show('已更新物品資料');
      setEditing(false);
      reload();
    } catch (cause) {
      setEditError(cause instanceof Error ? cause.message : '更新物品失敗');
    } finally {
      setSavingEdit(false);
    }
  }

  if (loading) return <LoadingState label="正在載入物品詳情…" rows={4} />;
  if (error) return <ErrorState title="無法載入物品" message={error} actionLabel="重試" onAction={() => { setLoading(true); reload(); }} />;
  if (!item) return <EmptyState title="找不到這筆物品" message="這筆物品可能已被移除，或不屬於目前家庭。" />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="page-section bg-gradient-to-br from-white to-teal-50/60">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">物品詳情</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{item.name}</h2></div>
          {item.status !== 'deleted' ? <Button type="button" variant="secondary" leadingIcon={<Pencil aria-hidden="true" className="h-4 w-4" />} onClick={beginEdit}>編輯資料</Button> : null}
        </div>
        <p className="mt-2 text-sm text-slate-600">{item.category} · {itemStatusLabels[item.status]}</p>
        <p className="mt-2 text-sm text-slate-700">目前位置：<span className="font-semibold text-teal-800">{locationName(item.currentLocationId)}</span></p>
        {tagNames.length ? <p className="mt-2 text-sm text-teal-700">{tagNames.map((name) => `#${name}`).join(' ')}</p> : null}
        {item.notes ? <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm leading-6 text-slate-600">{item.notes}</p> : null}
      </section>

      {editing ? <form onSubmit={(event) => void saveEdit(event)} className="page-section space-y-4" aria-labelledby="edit-item-heading">
        <div><p className="page-eyebrow">基本資料</p><h3 id="edit-item-heading" className="mt-1 text-lg font-bold text-slate-900">編輯物品</h3></div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField id="edit-item-name" label="物品名稱" required>
            <input id="edit-item-name" required maxLength={120} value={editState.name} onChange={(event) => setEditState({ ...editState, name: event.target.value })} className="field-control mt-1 w-full" />
          </FormField>
          <CategoryPicker householdId={householdId} value={editState.category} onChange={(category) => setEditState({ ...editState, category })} required />
          <FormField id="edit-item-notes" label="備註">
            <textarea id="edit-item-notes" rows={3} value={editState.notes} onChange={(event) => setEditState({ ...editState, notes: event.target.value })} className="field-control mt-1 min-h-28 w-full" />
          </FormField>
          <TagPicker selected={editState.tagNames} onChange={(next) => setEditState({ ...editState, tagNames: next })} />
        </div>
        {editError ? <p role="alert" className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{editError}</p> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" disabled={savingEdit} onClick={() => setEditing(false)}>取消</Button><Button type="submit" busy={savingEdit}>儲存變更</Button></div>
      </form> : null}

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
