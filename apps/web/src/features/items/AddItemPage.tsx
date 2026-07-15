import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { CategoryPicker } from '../categories/CategoryPicker';
import { LocationPicker } from '../locations/LocationPicker';
import { TagPicker } from '../tags/TagPicker';
import { PhotoInput } from './PhotoInput';
import { createItem } from './createItem';
import { useItemForm, emptyItemForm } from './useItemForm';
import { listLocationsByHousehold } from '../../db/locationRepository';
import { useHousehold } from '../../services/householdContextValue';
import { useToast } from '../../components/toast/toastContext';

const requiredMark = <span className="text-rose-500"> *</span>;

export function AddItemPage() {
  const { householdId, userId, deviceId } = useHousehold();
  // 由位置詳情頁「在此位置新增物品」帶入的預選位置，只在掛載時讀取一次。
  const preselectedLocationId = useMemo(() => new URLSearchParams(window.location.search).get('locationId') ?? '', []);
  const { state, setState, visibleErrors, isValid, setSubmitted } = useItemForm(
    preselectedLocationId ? { ...emptyItemForm, locationId: preselectedLocationId } : emptyItemForm
  );
  const { show } = useToast();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!preselectedLocationId) return;
    void listLocationsByHousehold(householdId).then((locations) => {
      if (!locations.some((location) => location.id === preselectedLocationId)) {
        setState((prev) => ({ ...prev, locationId: '' }));
      }
    });
  }, [preselectedLocationId, householdId, setState]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      await createItem({
        householdId,
        createdBy: userId,
        updatedBy: userId,
        deviceId,
        name: state.name,
        category: state.category,
        currentLocationId: state.locationId,
        notes: state.notes,
        tagNames: state.tagNames,
        photo: state.photo?.metadata,
        thumbnailBlob: state.photo?.thumbnail.blob
      });
      show('已新增物品');
      setState(emptyItemForm);
      setSubmitted(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="item-name">物品名稱{requiredMark}</label>
        <input id="item-name" value={state.name} onChange={(event) => setState({ ...state, name: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
        {visibleErrors.name && <p className="mt-1 text-xs text-rose-600">{visibleErrors.name}</p>}
      </div>
      <div>
        <CategoryPicker householdId={householdId} value={state.category} onChange={(category) => setState({ ...state, category })} required />
        {visibleErrors.category && <p className="mt-1 text-xs text-rose-600">{visibleErrors.category}</p>}
      </div>
      <div>
        <LocationPicker householdId={householdId} value={state.locationId} onChange={(locationId) => setState({ ...state, locationId })} actorId={userId} deviceId={deviceId} required />
        {visibleErrors.locationId && <p className="mt-1 text-xs text-rose-600">{visibleErrors.locationId}</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="item-notes">備註</label>
        <textarea id="item-notes" value={state.notes} onChange={(event) => setState({ ...state, notes: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" rows={3} />
      </div>
      <PhotoInput value={state.photo} onChange={(photo) => setState({ ...state, photo })} />
      <TagPicker selected={state.tagNames} onChange={(tagNames) => setState({ ...state, tagNames })} />
      <button disabled={saving} className="w-full rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white disabled:bg-slate-300">{saving ? '正在儲存到本機...' : '離線儲存'}</button>
      {error && <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    </form>
  );
}
