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
interface ItemDetailState { item: Item | null; location: Location | null; history: HistoryEntry[]; }

async function loadItemDetail(itemId: string): Promise<ItemDetailState> {
  const found = await getItemById(demoHouseholdId, itemId);
  const location = found ? (await getLocationById(demoHouseholdId, found.currentLocationId)) ?? null : null;
  const history = await listItemHistory(demoHouseholdId, itemId);
  return { item: found ?? null, location, history };
}

export function ItemDetailPage({ itemId }: Props) {
  const [detail, setDetail] = useState<ItemDetailState>({ item: null, location: null, history: [] });
  const [error, setError] = useState<string | null>(null);

  function reload(): void {
    void loadItemDetail(itemId)
      .then((nextDetail) => {
        setDetail(nextDetail);
        setError(null);
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : 'Unable to load item');
      });
  }

  useEffect(() => {
    let active = true;
    void loadItemDetail(itemId)
      .then((nextDetail) => {
        if (active) {
          setDetail(nextDetail);
          setError(null);
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load item');
      });
    return () => {
      active = false;
    };
  }, [itemId]);

  const { item, location, history } = detail;
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!item) return <p className="text-sm text-slate-500">Item not found in the current household.</p>;
  return <div className="space-y-4"><div><h2 className="text-xl font-semibold text-slate-900">{item.name}</h2><p className="text-sm text-slate-500">{item.category} · {item.status}</p><p className="mt-2 text-sm text-slate-700">Current location: <span className="font-medium">{location?.path ?? item.currentLocationId}</span></p>{item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}</div><MoveItemDialog householdId={demoHouseholdId} itemId={item.id} currentLocationId={item.currentLocationId} actorId={demoActorId} deviceId={demoDeviceId} onMoved={reload} /><section><h3 className="font-semibold text-slate-900">History</h3><ol className="mt-2 space-y-2">{history.map((entry) => <li key={entry.id} className="rounded-xl border border-slate-200 p-3 text-sm"><p className="font-medium text-slate-800">{entry.action}</p><p className="text-xs text-slate-500">{new Date(entry.occurredAt).toLocaleString()}</p>{entry.fromLocationId || entry.toLocationId ? <p className="text-xs text-slate-600">{entry.fromLocationId ?? '—'} → {entry.toLocationId ?? '—'}</p> : null}</li>)}</ol></section></div>;
}
