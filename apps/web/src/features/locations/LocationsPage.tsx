import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { toHref } from '../../app/basePath';
import type { Location } from '../../domain/types';
import { formatLocationType } from '../../domain/labels';
import { listItemsByHousehold } from '../../db/itemRepository';
import { deleteLocation, listLocationsByHousehold, previewDeleteLocation } from '../../db/locationRepository';
import { EmptyState, ErrorState, LoadingState } from '../../components/StatusState';
import { LocationForm } from './LocationForm';
import { buildLocationTree, type LocationTreeNode } from './locationTree';
import { useHousehold } from '../../services/householdContextValue';
import { useToast } from '../../components/toast/toastContext';
import { Button, ConfirmDialog, IconButton } from '../../components/ui';

interface DeleteState { location: Location; affectedItemCount: number; }

function Node({ node, onEdit, onDelete }: { node: LocationTreeNode; onEdit: (location: Location) => void; onDelete: (location: Location) => void }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const childrenId = `location-children-${node.location.id}`;
  return (
    <li className="min-w-0">
      <div className="interactive-card flex min-h-16 min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3">
        {hasChildren ? (
          <IconButton type="button" aria-label={`${expanded ? '收合' : '展開'}位置「${node.location.name}」`} aria-expanded={expanded} aria-controls={childrenId} onClick={() => setExpanded((value) => !value)} className="rounded-xl">
            {expanded ? <ChevronDown aria-hidden="true" className="h-5 w-5" /> : <ChevronRight aria-hidden="true" className="h-5 w-5" />}
          </IconButton>
        ) : <span aria-hidden="true" className="h-11 w-3 shrink-0" />}
        <div className="min-w-0 flex-1">
          <a href={toHref(`/locations/${node.location.id}`)} className="inline-flex min-h-11 max-w-full cursor-pointer items-center rounded-xl pr-2 text-base font-bold text-teal-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">{node.location.name}</a>
          <p className="text-xs leading-5 text-slate-600 sm:text-sm">{formatLocationType(node.location.type)} · 含子位置共 {node.descendantItemCount} 件物品</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <IconButton aria-label={`編輯位置「${node.location.name}」`} onClick={() => onEdit(node.location)}><Pencil aria-hidden="true" className="h-5 w-5" /></IconButton>
          <IconButton variant="danger" aria-label={`刪除位置「${node.location.name}」`} onClick={() => onDelete(node.location)}><Trash2 aria-hidden="true" className="h-5 w-5" /></IconButton>
        </div>
      </div>
      {hasChildren && expanded ? (
        <ul id={childrenId} className="ml-3 mt-2 space-y-2 border-l-2 border-teal-100 pl-2 sm:ml-5 sm:pl-3">
          {node.children.map((child) => <Node key={child.location.id} node={child} onEdit={onEdit} onDelete={onDelete} />)}
        </ul>
      ) : null}
    </li>
  );
}

export function LocationsPage() {
  const { householdId, userId, deviceId } = useHousehold();
  const { show } = useToast();
  const [tree, setTree] = useState<LocationTreeNode[]>([]);
  const [editing, setEditing] = useState<Location | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryRevision, setRetryRevision] = useState(0);

  async function reload() {
    const [locations, items] = await Promise.all([listLocationsByHousehold(householdId), listItemsByHousehold(householdId)]);
    setTree(buildLocationTree(locations, items));
    setLoadError(null);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    void Promise.all([listLocationsByHousehold(householdId), listItemsByHousehold(householdId)])
      .then(([locations, items]) => {
        if (!active) return;
        setTree(buildLocationTree(locations, items));
        setLoadError(null);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setLoadError(cause instanceof Error ? cause.message : '無法載入位置');
        setLoading(false);
      });
    return () => { active = false; };
  }, [householdId, retryRevision]);

  async function handleDeleteRequest(location: Location) {
    try {
      const preview = await previewDeleteLocation({ id: location.id, householdId });
      setDeleteState({ location, affectedItemCount: preview.affectedItemCount });
    } catch (error) {
      show(error instanceof Error ? error.message : '無法刪除此位置', 'error');
    }
  }

  async function confirmDelete() {
    if (!deleteState) return;
    setDeleting(true);
    try {
      await deleteLocation({ id: deleteState.location.id, householdId, actorId: userId, deviceId });
      show(`已刪除位置「${deleteState.location.name}」`);
      setDeleteState(null);
      await reload();
    } catch (error) {
      show(error instanceof Error ? error.message : '刪除失敗', 'error');
    } finally {
      setDeleting(false);
    }
  }

  function startEdit(location: Location) {
    setCreateOpen(false);
    setEditing(location);
  }

  const formOpen = createOpen || Boolean(editing);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">家庭地圖</p><h2 className="mt-1 text-2xl font-bold text-slate-900">位置總覽</h2><p className="mt-1 text-sm text-slate-600">從房間、櫃位到箱子，建立可以快速查找的階層。</p></div>
        <Button type="button" variant={formOpen ? 'secondary' : 'primary'} leadingIcon={<Plus aria-hidden="true" className="h-5 w-5" />} onClick={() => { setEditing(null); setCreateOpen((value) => !value); }}>{formOpen ? '收合位置表單' : '新增位置'}</Button>
      </div>

      {formOpen ? <LocationForm key={editing?.id ?? 'new-location'} householdId={householdId} editing={editing} actorId={userId} deviceId={deviceId} onSaved={() => { setEditing(null); setCreateOpen(false); void reload(); }} /> : null}

      {loading ? <LoadingState label="正在載入位置階層…" rows={3} /> : null}
      {!loading && loadError ? <ErrorState title="無法載入位置" message={loadError} actionLabel="重試" onAction={() => { setLoading(true); setLoadError(null); setRetryRevision((value) => value + 1); }} /> : null}
      {!loading && !loadError && tree.length > 0 ? <ul className="space-y-3">{tree.map((node) => <Node key={node.location.id} node={node} onEdit={startEdit} onDelete={handleDeleteRequest} />)}</ul> : null}
      {!loading && !loadError && tree.length === 0 ? <EmptyState title="還沒有位置" message="先建立一個房間、收納櫃或箱子，之後就能快速找到物品。" actionLabel="新增第一個位置" onAction={() => setCreateOpen(true)} /> : null}

      <ConfirmDialog
        open={Boolean(deleteState)}
        title={`刪除位置「${deleteState?.location.name ?? ''}」？`}
        description={deleteState?.affectedItemCount
          ? <>此位置有 <strong className="text-rose-700">{deleteState.affectedItemCount} 件物品</strong>，刪除後這些物品將變為未設置位置。</>
          : '此位置目前沒有物品，刪除後無法復原。'}
        confirmLabel="確認刪除"
        busy={deleting}
        onCancel={() => setDeleteState(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
