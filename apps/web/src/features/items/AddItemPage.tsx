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
import { Button } from '../../components/ui';

const requiredMark = <span className="text-rose-500"> *</span>;

export function AddItemPage() {
  const { householdId, userId, deviceId } = useHousehold();
  // 由位置詳情頁「在此位置新增物品」帶入的預選位置，只在掛載時讀取一次。
  const preselectedLocationId = useMemo(() => new URLSearchParams(window.location.search).get('locationId') ?? '', []);
  const { state, setState, errors, visibleErrors, isValid, setSubmitted } = useItemForm(
    preselectedLocationId ? { ...emptyItemForm, locationId: preselectedLocationId } : emptyItemForm
  );
  const { show } = useToast();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dirty = Boolean(state.name || state.category || state.locationId || state.notes || state.tagNames.length || state.photo);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty || saving) return;
      event.preventDefault();
    }
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [dirty, saving]);

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
    if (!isValid) {
      const firstInvalidId = errors.name ? 'item-name'
        : errors.category ? 'item-category'
          : 'item-location';
      window.requestAnimationFrame(() => document.getElementById(firstInvalidId)?.focus());
      return;
    }
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
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-5">
      <div className="page-section">
        <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">基本資料</p><h2 className="mt-1 text-xl font-bold text-slate-900">建立一筆物品</h2><p className="mt-1 text-sm text-slate-600">先輸入名稱與位置，之後可以補上照片和標籤。</p></div>
        <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="item-name">物品名稱{requiredMark}</label>
        <input id="item-name" required maxLength={120} aria-invalid={Boolean(visibleErrors.name)} aria-describedby={visibleErrors.name ? 'item-name-error' : undefined} value={state.name} onChange={(event) => setState({ ...state, name: event.target.value })} className="field-control mt-1 w-full" />
        {visibleErrors.name && <p id="item-name-error" role="alert" className="mt-1 text-xs text-rose-700">{visibleErrors.name}</p>}
      </div>
      <div>
        <CategoryPicker householdId={householdId} value={state.category} onChange={(category) => setState({ ...state, category })} required errorId={visibleErrors.category ? 'item-category-error' : undefined} />
        {visibleErrors.category && <p id="item-category-error" role="alert" className="mt-1 text-xs text-rose-700">{visibleErrors.category}</p>}
      </div>
      <div>
        <LocationPicker householdId={householdId} value={state.locationId} onChange={(locationId) => setState({ ...state, locationId })} actorId={userId} deviceId={deviceId} required errorId={visibleErrors.locationId ? 'item-location-error' : undefined} />
        {visibleErrors.locationId && <p id="item-location-error" role="alert" className="mt-1 text-xs text-rose-700">{visibleErrors.locationId}</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="item-notes">備註</label>
        <textarea id="item-notes" value={state.notes} onChange={(event) => setState({ ...state, notes: event.target.value })} className="field-control mt-1 min-h-28 w-full" rows={3} />
      </div>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
      <PhotoInput value={state.photo} onChange={(photo) => setState({ ...state, photo })} />
      <TagPicker selected={state.tagNames} onChange={(tagNames) => setState({ ...state, tagNames })} />
      </div>
      <Button type="submit" busy={saving} fullWidth size="lg">離線儲存</Button>
      {error && <p aria-live="polite" className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    </form>
  );
}
