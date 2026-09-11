import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CategoryPicker } from '../categories/CategoryPicker';
import { LocationPicker } from '../locations/LocationPicker';
import { TagPicker } from '../tags/TagPicker';
import { PhotoInput } from './PhotoInput';
import { createItem } from './createItem';
import { useItemForm, emptyItemForm } from './useItemForm';
import { listLocationsByHousehold } from '../../db/locationRepository';
import { useHousehold } from '../../services/householdContextValue';
import { useToast } from '../../components/toast/toastContext';
import { Button, ConfirmDialog, PageHeader } from '../../components/ui';
import { clearItemDraft, readItemDraft, writeItemDraft } from './itemDraft';
import { navigationRequestEvent, type NavigationRequestDetail } from '../../app/navigationRequest';
import { toHref } from '../../app/basePath';

const requiredMark = <span className="text-rose-500"> *</span>;

export function AddItemPage() {
  const { householdId, userId, deviceId } = useHousehold();
  // 由位置詳情頁「在此位置新增物品」帶入的預選位置，只在掛載時讀取一次。
  const preselectedLocationId = useMemo(() => new URLSearchParams(window.location.search).get('locationId') ?? '', []);
  const restoredDraft = useMemo(() => readItemDraft(householdId, userId), [householdId, userId]);
  const initialState = useMemo(() => ({
    ...emptyItemForm,
    ...restoredDraft,
    locationId: preselectedLocationId || restoredDraft?.locationId || '',
    photo: undefined,
  }), [preselectedLocationId, restoredDraft]);
  const { state, setState, errors, visibleErrors, isValid, setSubmitted } = useItemForm(initialState);
  const { show } = useToast();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const allowNavigation = useRef(false);
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
    if (dirty) writeItemDraft(householdId, userId, state);
    else clearItemDraft(householdId, userId);
  }, [dirty, householdId, state, userId]);

  useEffect(() => {
    function blockNavigation(event: Event) {
      if (!dirty || saving || allowNavigation.current) return;
      const request = event as CustomEvent<NavigationRequestDetail>;
      event.preventDefault();
      setPendingNavigation(() => request.detail.resume);
    }
    window.addEventListener(navigationRequestEvent, blockNavigation);
    return () => window.removeEventListener(navigationRequestEvent, blockNavigation);
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
      const result = await createItem({
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
      clearItemDraft(householdId, userId);
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      const intent = submitter?.value === 'continue' ? 'continue' : 'view';
      if (intent === 'continue') {
        setState({ ...emptyItemForm, category: state.category, locationId: state.locationId });
        window.requestAnimationFrame(() => document.getElementById('item-name')?.focus());
      } else {
        allowNavigation.current = true;
        setState(emptyItemForm);
        window.history.pushState({ scrollY: 0, fromPath: '/add' }, '', toHref(`/items/${result.itemId}`));
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      setSubmitted(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-5">
      <PageHeader eyebrow="快速收納" title="新增物品" description="先完成必要資料；照片、備註和標籤可以稍後補充。" />
      {restoredDraft ? <p role="status" className="rounded-2xl border border-teal-100 bg-teal-50 p-3 text-sm text-teal-800">已恢復這個家庭尚未完成的文字草稿。照片不會保存在草稿中。</p> : null}
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
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="submit" name="saveIntent" value="view" busy={saving} fullWidth size="lg">儲存並查看</Button>
        <Button type="submit" name="saveIntent" value="continue" busy={saving} fullWidth size="lg" variant="secondary">儲存並繼續新增</Button>
      </div>
      {error && <p aria-live="polite" className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <ConfirmDialog open={Boolean(pendingNavigation)} title="捨棄尚未儲存的內容？" description="文字草稿會一併清除，已選照片也不會保留。" confirmLabel="捨棄並離開" onCancel={() => setPendingNavigation(null)} onConfirm={() => {
        const resume = pendingNavigation;
        allowNavigation.current = true;
        clearItemDraft(householdId, userId);
        setPendingNavigation(null);
        resume?.();
      }} />
    </form>
  );
}
