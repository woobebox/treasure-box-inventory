import { type FormEvent, useEffect, useState } from 'react';
import type { Location } from '../../domain/types';
import { createLocation, listLocationsByHousehold, updateLocation } from '../../db/locationRepository';
import { listLocationTypeOptions, type LocationTypeOption } from '../../db/optionRepository';

interface Props { householdId: string; editing?: Location | null; onSaved: (location: Location) => void; actorId?: string; deviceId?: string; }

export function LocationForm({ householdId, editing, onSaved, actorId, deviceId }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState(editing?.name ?? '');
  const [type, setType] = useState(editing?.type ?? 'room');
  const [typeOptions, setTypeOptions] = useState<LocationTypeOption[]>([]);
  const [parentId, setParentId] = useState(editing?.parentId ?? '');
  const [message, setMessage] = useState('');
  useEffect(() => {
    void Promise.all([listLocationsByHousehold(householdId), listLocationTypeOptions(householdId)]).then(([nextLocations, nextTypes]) => {
      setLocations(nextLocations);
      setTypeOptions(nextTypes.some((option) => option.value === type) ? nextTypes : [...nextTypes, { value: type, label: `${type}（目前使用）` }]);
    });
  }, [householdId, type]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const saved = editing ? await updateLocation({ id: editing.id, householdId, name, type, parentId: parentId || null, actorId, deviceId }) : await createLocation({ householdId, name, type, parentId: parentId || null, actorId, deviceId });
      setLocations(await listLocationsByHousehold(householdId));
      setMessage('位置已離線儲存'); setName(''); setParentId(''); onSaved(saved);
    } catch (error) { setMessage(error instanceof Error ? error.message : '位置儲存失敗'); }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <input aria-label="位置名稱" value={name} onChange={(event) => setName(event.target.value)} placeholder="位置名稱" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
      <select aria-label="位置類型" value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2">{typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <p className="text-xs text-slate-500">位置類型統一在「設定」的「分類與位置類型」管理。</p>
      <select aria-label="上層位置" value={parentId} onChange={(event) => setParentId(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2"><option value="">無上層位置</option>{locations.filter((location) => location.id !== editing?.id).map((location) => <option key={location.id} value={location.id}>{location.path}</option>)}</select>
      <button className="w-full rounded-2xl bg-teal-700 px-4 py-2 font-semibold text-white">{editing ? '更新位置' : '新增位置'}</button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  );
}
