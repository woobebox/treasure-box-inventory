import { type FormEvent, useEffect, useState } from 'react';
import type { Location } from '../../domain/types';
import { createLocation, listLocationsByHousehold, updateLocation } from '../../db/locationRepository';
import { listLocationTypeOptions, type LocationTypeOption } from '../../db/optionRepository';
import { Button } from '../../components/ui';

interface Props { householdId: string; editing?: Location | null; onSaved: (location: Location) => void; actorId?: string; deviceId?: string; }

export function LocationForm({ householdId, editing, onSaved, actorId, deviceId }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState(editing?.name ?? '');
  const [type, setType] = useState(editing?.type ?? 'room');
  const [typeOptions, setTypeOptions] = useState<LocationTypeOption[]>([]);
  const [parentId, setParentId] = useState(editing?.parentId ?? '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    void Promise.all([listLocationsByHousehold(householdId), listLocationTypeOptions(householdId)]).then(([nextLocations, nextTypes]) => {
      setLocations(nextLocations);
      setTypeOptions(nextTypes.some((option) => option.value === type) ? nextTypes : [...nextTypes, { value: type, label: `${type}（目前使用）` }]);
    });
  }, [householdId, type]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const saved = editing ? await updateLocation({ id: editing.id, householdId, name, type, parentId: parentId || null, actorId, deviceId }) : await createLocation({ householdId, name, type, parentId: parentId || null, actorId, deviceId });
      setLocations(await listLocationsByHousehold(householdId));
      setMessage('位置已離線儲存'); setName(''); setParentId(''); onSaved(saved);
    } catch (error) { setMessage(error instanceof Error ? error.message : '位置儲存失敗'); }
    finally { setSaving(false); }
  }
  return (
    <form onSubmit={submit} className="page-section space-y-4 bg-teal-50/60">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">位置配置</p><h2 className="mt-1 text-xl font-bold text-slate-900">{editing ? '編輯位置' : '新增位置'}</h2></div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-semibold text-slate-700" htmlFor="location-name">位置名稱<input id="location-name" autoFocus={Boolean(editing)} required value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：玄關收納櫃" className="field-control mt-1 w-full font-normal" /></label>
        <label className="text-sm font-semibold text-slate-700" htmlFor="location-type">位置類型<select id="location-type" value={type} onChange={(event) => setType(event.target.value)} className="field-control mt-1 w-full font-normal">{typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700" htmlFor="location-parent">上層位置<select id="location-parent" value={parentId} onChange={(event) => setParentId(event.target.value)} className="field-control mt-1 w-full font-normal"><option value="">無上層位置</option>{locations.filter((location) => location.id !== editing?.id).map((location) => <option key={location.id} value={location.id}>{location.path}</option>)}</select></label>
      </div>
      <p className="text-xs leading-5 text-slate-600">位置類型統一在「設定」的「分類與位置類型」管理。</p>
      <Button type="submit" busy={saving} fullWidth>{editing ? '更新位置' : '新增位置'}</Button>
      {message && <p aria-live="polite" className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-600">{message}</p>}
    </form>
  );
}
