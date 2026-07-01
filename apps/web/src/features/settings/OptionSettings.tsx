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

export function OptionSettings() {
  const { householdId, userId, deviceId } = useHousehold();
  const { show } = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [locationTypes, setLocationTypes] = useState<LocationTypeOption[]>([]);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [locationTypeDraft, setLocationTypeDraft] = useState('');
  const [editing, setEditing] = useState<{ kind: 'category' | 'locationType'; key: string } | null>(null);
  const [editValue, setEditValue] = useState('');
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
    try { await removeCategoryOption(householdId, category); show(`已移除分類「${category}」`); await reload(); }
    catch (error) { show(error instanceof Error ? error.message : '移除分類失敗', 'error'); }
  }

  async function removeLocationType(option: LocationTypeOption): Promise<void> {
    try { await removeLocationTypeOption(householdId, option.value); show(`已移除位置類型「${option.label}」`); await reload(); }
    catch (error) { show(error instanceof Error ? error.message : '移除位置類型失敗', 'error'); }
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
        <span key={key} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs ring-1 ring-teal-300">
          <input autoFocus aria-label="重新命名" value={editValue} onChange={(event) => setEditValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void submitEdit(); if (event.key === 'Escape') cancelEdit(); }} className="w-24 rounded border border-slate-300 px-1 py-0.5 text-xs" />
          <button type="button" aria-label="確認" onClick={() => void submitEdit()} className="text-teal-700"><Check className="h-3.5 w-3.5" /></button>
          <button type="button" aria-label="取消" onClick={cancelEdit} className="text-slate-400"><X className="h-3.5 w-3.5" /></button>
        </span>
      );
    }
    return (
      <span key={key} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${isDefault ? 'bg-slate-100 text-slate-500' : 'bg-teal-50 text-teal-800'}`}>
        {label}
        {!isDefault ? (
          <>
            <button type="button" aria-label={`重新命名 ${label}`} onClick={() => startEdit(kind, key)} className="text-teal-600 hover:text-teal-900"><Pencil className="h-3 w-3" /></button>
            <button type="button" aria-label={`刪除 ${label}`} onClick={onRemove} className="text-rose-500 hover:text-rose-700"><X className="h-3.5 w-3.5" /></button>
          </>
        ) : null}
      </span>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-semibold text-slate-900">分類與位置類型</h2>
        <p className="mt-1 text-sm text-slate-600">分類會用在新增物品；位置類型會用在新增位置。自訂項目可重新命名或刪除，重新命名會連動更新既有資料。</p>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">物品分類</h3>
        <div className="flex gap-2">
          <input aria-label="新增物品分類" value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="例如：露營用品" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" onClick={() => void addCategory()} className="rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white">新增</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => renderChip('category', category, category, defaultCategorySet.has(category.toLocaleLowerCase()), () => void removeCategory(category)))}
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">位置類型</h3>
        <div className="flex gap-2">
          <input aria-label="新增位置類型" value={locationTypeDraft} onChange={(event) => setLocationTypeDraft(event.target.value)} placeholder="例如：展示架" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" onClick={() => void addLocationType()} className="rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white">新增</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {locationTypes.map((option) => renderChip('locationType', option.value, option.label, defaultLocationTypeSet.has(option.value), () => void removeLocationType(option)))}
        </div>
      </div>
    </section>
  );
}
