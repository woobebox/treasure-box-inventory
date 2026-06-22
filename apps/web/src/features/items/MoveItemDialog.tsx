import { useEffect, useState } from 'react';
import { listLocationsByHousehold } from '../../db/locationRepository';
import type { Location } from '../../domain/types';
import { moveItem } from './moveItem';

interface Props { householdId: string; itemId: string; currentLocationId: string; actorId: string; deviceId: string; onMoved: () => void; }

export function MoveItemDialog({ householdId, itemId, currentLocationId, actorId, deviceId, onMoved }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [toLocationId, setToLocationId] = useState(currentLocationId);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { void listLocationsByHousehold(householdId).then(setLocations); }, [householdId]);
  async function submit() {
    setMessage(null);
    try { await moveItem({ householdId, itemId, toLocationId, actorId, deviceId }); setMessage('Moved locally and queued for sync.'); onMoved(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Move failed'); }
  }
  return <div className="space-y-3 rounded-2xl border border-teal-100 bg-teal-50 p-3"><label className="text-sm font-medium text-slate-700" htmlFor="move-location">Move to</label><select id="move-location" value={toLocationId} onChange={(event) => setToLocationId(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2">{locations.map((location) => <option key={location.id} value={location.id}>{location.path}</option>)}</select><button type="button" onClick={submit} disabled={!toLocationId || toLocationId === currentLocationId} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">Save move</button>{message ? <p className="text-xs text-slate-600">{message}</p> : null}</div>;
}
