import { useEffect, useState } from 'react';
import { getItemById } from '../../db/itemRepository';
import { listItemHistory } from '../../db/historyRepository';
import { getLocationById } from '../../db/locationRepository';
import type { HistoryEntry, Item, Location } from '../../domain/types';
import { MoveItemDialog } from './MoveItemDialog';

const demoHouseholdId = 'local-demo-household';
const demoActorId = 'local-demo-user';
const demoDeviceId = 'local-demo-device';

interface Props { itemId: string; }

export function ItemDetailPage({ itemId }: Props) {
  const [item, setItem] = useState<Item | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  async function reload() {
    const found = await getItemById(demoHouseholdId, itemId);
    setItem(found ?? null);
    setLocation(found ? (await getLocationById(demoHouseholdId, found.currentLocationId)) ?? null : null);
    setHistory(await listItemHistory(demoHouseholdId, itemId));
  }
  useEffect(() => { void reload().catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load item')); }, [itemId]);
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!item) return <p className="text-sm text-slate-500">Item not found in the current household.</p>;
  return <div className="space-y-4"><div><h2 className="text-xl font-semibold text-slate-900">{item.name}</h2><p className="text-sm text-slate-500">{item.category} · {item.status}</p><p className="mt-2 text-sm text-slate-700">Current location: <span className="font-medium">{location?.path ?? item.currentLocationId}</span></p>{item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}</div><MoveItemDialog householdId={demoHouseholdId} itemId={item.id} currentLocationId={item.currentLocationId} actorId={demoActorId} deviceId={demoDeviceId} onMoved={() => void reload()} /><section><h3 className="font-semibold text-slate-900">History</h3><ol className="mt-2 space-y-2">{history.map((entry) => <li key={entry.id} className="rounded-xl border border-slate-200 p-3 text-sm"><p className="font-medium text-slate-800">{entry.action}</p><p className="text-xs text-slate-500">{new Date(entry.occurredAt).toLocaleString()}</p>{entry.fromLocationId || entry.toLocationId ? <p className="text-xs text-slate-600">{entry.fromLocationId ?? '—'} → {entry.toLocationId ?? '—'}</p> : null}</li>)}</ol></section></div>;
}
