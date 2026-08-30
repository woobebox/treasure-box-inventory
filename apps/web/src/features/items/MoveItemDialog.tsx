import { useEffect, useState } from 'react';
import { listLocationsByHousehold } from '../../db/locationRepository';
import type { Location } from '../../domain/types';
import { moveItem } from './moveItem';
import { Button } from '../../components/ui';

interface Props { householdId: string; itemId: string; currentLocationId: string; actorId: string; deviceId: string; onMoved: () => void; }

export function MoveItemDialog({ householdId, itemId, currentLocationId, actorId, deviceId, onMoved }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [toLocationId, setToLocationId] = useState(currentLocationId);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { void listLocationsByHousehold(householdId).then(setLocations); }, [householdId]);
  async function submit() {
    setMessage(null);
    try { await moveItem({ householdId, itemId, toLocationId, actorId, deviceId }); setMessage('已在本機移動，並加入待同步佇列。'); onMoved(); }
    catch (error) { setMessage(error instanceof Error ? error.message : '移動失敗'); }
  }
  return <div className="page-section space-y-3 bg-teal-50/60"><div><p className="text-sm font-semibold text-slate-800">調整位置</p><p className="mt-1 text-xs text-slate-600">移動後會先儲存在本機，再加入待同步佇列。</p></div><label className="text-sm font-medium text-slate-700" htmlFor="move-location">移動到</label><select id="move-location" value={toLocationId} onChange={(event) => setToLocationId(event.target.value)} className="field-control w-full">{locations.map((location) => <option key={location.id} value={location.id}>{location.path}</option>)}</select><Button type="button" onClick={submit} disabled={!toLocationId || toLocationId === currentLocationId}>儲存移動</Button>{message ? <p aria-live="polite" className="rounded-2xl bg-white/70 p-3 text-xs leading-5 text-slate-700">{message}</p> : null}</div>;
}
