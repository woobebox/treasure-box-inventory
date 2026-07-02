import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Location } from '../../domain/types';
import { formatLocationType } from '../../domain/labels';
import { listItemsByHousehold } from '../../db/itemRepository';
import { deleteLocation, listLocationsByHousehold, previewDeleteLocation } from '../../db/locationRepository';
import { LocationForm } from './LocationForm';
import { buildLocationTree, type LocationTreeNode } from './locationTree';
import { useHousehold } from '../../services/householdContextValue';
import { useToast } from '../../components/toast/toastContext';

interface DeleteState { location: Location; affectedItemCount: number; }

function Node({ node, onEdit, onDelete }: { node: LocationTreeNode; onEdit: (location: Location) => void; onDelete: (location: Location) => void }) {
  return (
    <li className="interactive-card mt-2 rounded-2xl border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <button className="font-semibold text-teal-800 text-left" onClick={() => onEdit(node.location)}>{node.location.name}</button>
          <p className="text-xs text-slate-500">{formatLocationType(node.location.type)} · 含子位置共 {node.descendantItemCount} 件物品</p>
        </div>
        <button type="button" aria-label={`刪除位置「${node.location.name}」`} onClick={() => onDelete(node.location)} className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {node.children.length > 0 && (
        <ul className="ml-4 border-l border-slate-200 pl-3">
          {node.children.map((child) => <Node key={child.location.id} node={child} onEdit={onEdit} onDelete={onDelete} />)}
        </ul>
      )}
    </li>
  );
}

export function LocationsPage() {
  const { householdId, userId, deviceId } = useHousehold();
  const { show } = useToast();
  const [tree, setTree] = useState<LocationTreeNode[]>([]);
  const [editing, setEditing] = useState<Location | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function reload() {
    const [locations, items] = await Promise.all([listLocationsByHousehold(householdId), listItemsByHousehold(householdId)]);
    setTree(buildLocationTree(locations, items));
  }

  useEffect(() => {
    void Promise.all([listLocationsByHousehold(householdId), listItemsByHousehold(householdId)]).then(([locations, items]) => setTree(buildLocationTree(locations, items)));
  }, [householdId]);

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
      void reload();
    } catch (error) {
      show(error instanceof Error ? error.message : '刪除失敗', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <LocationForm key={editing?.id ?? 'new-location'} householdId={householdId} editing={editing} actorId={userId} deviceId={deviceId} onSaved={() => { setEditing(null); void reload(); }} />
      <ul>{tree.map((node) => <Node key={node.location.id} node={node} onEdit={setEditing} onDelete={handleDeleteRequest} />)}</ul>

      {deleteState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-4 shadow-xl">
            <h2 className="font-semibold text-slate-900">刪除位置「{deleteState.location.name}」？</h2>
            {deleteState.affectedItemCount > 0
              ? <p className="text-sm text-slate-600">此位置有 <span className="font-semibold text-rose-600">{deleteState.affectedItemCount} 件物品</span>，刪除後這些物品將變為未設置位置。</p>
              : <p className="text-sm text-slate-600">此位置目前沒有物品，刪除後無法復原。</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setDeleteState(null)} className="flex-1 rounded-xl border border-slate-300 py-2 text-sm font-semibold text-slate-700">取消</button>
              <button type="button" disabled={deleting} onClick={() => void confirmDelete()} className="flex-1 rounded-xl bg-rose-600 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {deleting ? '刪除中…' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
