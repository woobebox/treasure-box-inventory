import { type FormEvent, useEffect, useState } from 'react';
import type { Location } from '../../domain/types';
import { createLocation, listLocationsByHousehold, updateLocation } from '../../db/locationRepository';

interface Props { householdId: string; editing?: Location | null; onSaved: (location: Location) => void; }
const locationTypes: Location['type'][] = ['room', 'cabinet', 'drawer', 'hook', 'box', 'other'];

export function LocationForm({ householdId, editing, onSaved }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState(editing?.name ?? '');
  const [type, setType] = useState<Location['type']>(editing?.type ?? 'room');
  const [parentId, setParentId] = useState(editing?.parentId ?? '');
  const [message, setMessage] = useState('');
  useEffect(() => { void listLocationsByHousehold(householdId).then(setLocations); }, [householdId]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const saved = editing ? await updateLocation({ id: editing.id, householdId, name, type, parentId: parentId || null }) : await createLocation({ householdId, name, type, parentId: parentId || null });
      setMessage('位置已離線儲存'); setName(''); setParentId(''); onSaved(saved);
    } catch (error) { setMessage(error instanceof Error ? error.message : '位置儲存失敗'); }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <input aria-label="Location name" value={name} onChange={(event) => setName(event.target.value)} placeholder="位置名稱" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
      <select aria-label="Location type" value={type} onChange={(event) => setType(event.target.value as Location['type'])} className="w-full rounded-xl border border-slate-300 px-3 py-2">{locationTypes.map((option) => <option key={option} value={option}>{option}</option>)}</select>
      <select aria-label="Parent location" value={parentId} onChange={(event) => setParentId(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2"><option value="">No parent</option>{locations.filter((location) => location.id !== editing?.id).map((location) => <option key={location.id} value={location.id}>{location.path}</option>)}</select>
      <button className="w-full rounded-2xl bg-teal-700 px-4 py-2 font-semibold text-white">{editing ? 'Update location' : 'Add location'}</button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  );
}
