import { useEffect, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import {
  addCategoryOption,
  addLocationTypeOption,
  defaultCategoryOptions,
  defaultLocationTypeOptions,
  listCategoryOptions,
  listLocationTypeOptions,
  removeCategoryOption,
  removeLocationTypeOption,
  renameCategoryOption,
  renameLocationTypeOption,
  type LocationTypeOption
} from '../../db/optionRepository';
import { useHousehold } from '../../services/householdContextValue';
import { useToast } from '../../components/toast/toastContext';
import { Button, ConfirmDialog, IconButton } from '../../components/ui';

export function OptionSettings() {
  const { householdId, userId, deviceId } = useHousehold();
  const { show } = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [locationTypes, setLocationTypes] = useState<LocationTypeOption[]>([]);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [locationTypeDraft, setLocationTypeDraft] = useState('');
  const [editing, setEditing] = useState<{ kind: 'category' | 'locationType'; key: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [removeCandidate, setRemoveCandidate] = useState<{ kind: 'category' | 'locationType'; key: string; label: string } | null>(null);
  const [removing, setRemoving] = useState(false);
  const defaultCategorySet = new Set(defaultCategoryOptions.map((option) => option.toLocaleLowerCase()));
  const defaultLocationTypeSet = new Set(defaultLocationTypeOptions.map((option) => option.value));
  const actor = { actorId: userId, deviceId };

  async function reload(): Promise<void> {
    const [nextCategories, nextLocationTypes] = await Promise.all([listCategoryOptions(householdId), listLocationTypeOptions(householdId)]);
    setCategories(nextCategories);
    setLocationTypes(nextLocationTypes);
  }

  useEffect(() => {
    void Promise.all([listCategoryOptions(householdId), listLocationTypeOptions(householdId)]).then(([nextCategories, nextLocationTypes]) => {
      setCategories(nextCategories);
      setLocationTypes(nextLocationTypes);
    });
  }, [householdId]);

  async function addCategory(): Promise<void> {
    try { const category = await addCategoryOption(householdId, categoryDraft); setCategoryDraft(''); show(`已新增分類「${category}」`); await reload(); }
    catch (error) { show(error instanceof Error ? error.message : '新增分類失敗', 'error'); }
  }

  async function addLocationType(): Promise<void> {
    try { const type = await addLocationTypeOption(householdId, locationTypeDraft); setLocationTypeDraft(''); show(`已新增位置類型「${type.label}」`); await reload(); }
    catch (error) { show(error instanceof Error ? error.message : '新增位置類型失敗', 'error'); }
  }

  async function removeCategory(category: string): Promise<void> {
    setRemoving(true);
    try { await removeCategoryOption(householdId, category); show(`已移除分類「${category}」`); setRemoveCandidate(null); await reload(); }
    catch (error) { show(error instanceof Error ? error.message : '移除分類失敗', 'error'); }
    finally { setRemoving(false); }
  }

  async function removeLocationType(option: LocationTypeOption): Promise<void> {
    setRemoving(true);
    try { await removeLocationTypeOption(householdId, option.value); show(`已移除位置類型「${option.label}」`); setRemoveCandidate(null); await reload(); }
    catch (error) { show(error instanceof Error ? error.message : '移除位置類型失敗', 'error'); }
    finally { setRemoving(false); }
  }

  function startEdit(kind: 'category' | 'locationType', key: string): void { setEditing({ kind, key }); setEditValue(key); }
  function cancelEdit(): void { setEditing(null); setEditValue(''); }

  async function submitEdit(): Promise<void> {
    if (!editing) return;
    try {
      const count = editing.kind === 'category'
        ? await renameCategoryOption(householdId, editing.key, editValue, actor)
        : await renameLocationTypeOption(householdId, editing.key, editValue, actor);
      show(`已更名為「${editValue.trim()}」，連動更新 ${count} 筆`);
      cancelEdit();
      await reload();
    } catch (error) { show(error instanceof Error ? error.message : '重新命名失敗', 'error'); }
  }

  function renderChip(kind: 'category' | 'locationType', key: string, label: string, isDefault: boolean, onRemove: () => void) {
    const isEditing = editing?.kind === kind && editing.key === key;
    if (isEditing) {
      return (
        <span key={key} className="inline-flex items-center gap-1 rounded-2xl bg-white px-2 py-1 text-xs ring-1 ring-teal-300">
          <input autoFocus aria-label="重新命名" value={editValue} onChange={(event) => setEditValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void submitEdit(); if (event.key === 'Escape') cancelEdit(); }} className="w-24 rounded border border-slate-300 px-1 py-0.5 text-xs" />
          <IconButton aria-label="確認" onClick={() => void submitEdit()} className="h-12 w-12 rounded-xl"><Check aria-hidden="true" className="h-4 w-4" /></IconButton>
          <IconButton aria-label="取消" onClick={cancelEdit} className="h-12 w-12 rounded-xl"><X aria-hidden="true" className="h-4 w-4" /></IconButton>
        </span>
      );
    }
    return (
      <span key={key} className={`inline-flex items-center gap-1 rounded-2xl py-1 pl-3 pr-1 text-xs font-medium ${isDefault ? 'bg-slate-100 pr-3 text-slate-600' : 'bg-teal-50 text-teal-800'}`}>
        {label}
        {!isDefault ? (
          <>
            <IconButton aria-label={`重新命名 ${label}`} onClick={() => startEdit(kind, key)} className="h-12 w-12 rounded-xl"><Pencil aria-hidden="true" className="h-4 w-4" /></IconButton>
            <IconButton variant="danger" aria-label={`刪除 ${label}`} onClick={onRemove} className="h-12 w-12 rounded-xl"><X aria-hidden="true" className="h-4 w-4" /></IconButton>
          </>
        ) : null}
      </span>
    );
  }

  return (
    <section className="page-section space-y-5">
      <div>
        <h2 className="font-semibold text-slate-900">分類與位置類型</h2>
        <p className="mt-1 text-sm text-slate-600">分類會用在新增物品；位置類型會用在新增位置。自訂項目可重新命名或刪除，重新命名會連動更新既有資料。</p>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">物品分類</h3>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="new-category">新增物品分類</label><input id="new-category" value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="例如：露營用品" className="field-control min-w-0 flex-1 text-sm" />
          <Button type="button" onClick={() => void addCategory()}>新增</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => renderChip('category', category, category, defaultCategorySet.has(category.toLocaleLowerCase()), () => setRemoveCandidate({ kind: 'category', key: category, label: category })))}
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">位置類型</h3>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="new-location-type">新增位置類型</label><input id="new-location-type" value={locationTypeDraft} onChange={(event) => setLocationTypeDraft(event.target.value)} placeholder="例如：展示架" className="field-control min-w-0 flex-1 text-sm" />
          <Button type="button" onClick={() => void addLocationType()}>新增</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {locationTypes.map((option) => renderChip('locationType', option.value, option.label, defaultLocationTypeSet.has(option.value), () => setRemoveCandidate({ kind: 'locationType', key: option.value, label: option.label })))}
        </div>
      </div>
      <ConfirmDialog open={Boolean(removeCandidate)} title={`刪除「${removeCandidate?.label ?? ''}」？`} description="若仍有物品或位置使用此選項，系統會拒絕刪除並保留資料。" confirmLabel="確認刪除" busy={removing} onCancel={() => setRemoveCandidate(null)} onConfirm={() => {
        if (!removeCandidate) return;
        if (removeCandidate.kind === 'category') void removeCategory(removeCandidate.key);
        else void removeLocationType({ value: removeCandidate.key, label: removeCandidate.label });
      }} />
    </section>
  );
}
