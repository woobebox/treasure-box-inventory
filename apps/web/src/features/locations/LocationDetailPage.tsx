import { useEffect, useState } from 'react';
import { PackagePlus, Pencil } from 'lucide-react';
import type { Item, Location } from '../../domain/types';
import { formatLocationType } from '../../domain/labels';
import { listItemsByHousehold } from '../../db/itemRepository';
import { listLocationsByHousehold } from '../../db/locationRepository';
import { useHousehold } from '../../services/householdContextValue';
import { toHref } from '../../app/basePath';
import { ItemCard } from '../items/ItemCard';
import { LocationForm } from './LocationForm';
import { collectDescendantLocationIds } from './locationTree';

interface Props { locationId: string; }
interface DetailState { location: Location | null; locations: Location[]; items: Item[]; loaded: boolean; }

export function LocationDetailPage({ locationId }: Props) {
  const { householdId, userId, deviceId } = useHousehold();
  const [state, setState] = useState<DetailState>({ location: null, locations: [], items: [], loaded: false });
  const [editingOpen, setEditingOpen] = useState(false);

  function reload(): void {
    void Promise.all([listLocationsByHousehold(householdId), listItemsByHousehold(householdId)]).then(([locations, items]) => {
      setState({ location: locations.find((location) => location.id === locationId) ?? null, locations, items, loaded: true });
    });
  }

  useEffect(() => {
    let active = true;
    void Promise.all([listLocationsByHousehold(householdId), listItemsByHousehold(householdId)]).then(([locations, items]) => {
      if (active) setState({ location: locations.find((location) => location.id === locationId) ?? null, locations, items, loaded: true });
    });
    return () => { active = false; };
  }, [householdId, locationId]);

  if (!state.loaded) return <p className="text-sm text-slate-500">載入位置資料…</p>;
  if (!state.location) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">找不到這個位置，可能已被移除。</p>
        <a href={toHref('/locations')} className="inline-block rounded-xl border border-teal-300 px-4 py-2 text-sm font-semibold text-teal-700">回位置管理</a>
      </div>
    );
  }

  const location = state.location;
  const subtreeIds = new Set(collectDescendantLocationIds(state.locations, location.id));
  const pathById = new Map(state.locations.map((entry) => [entry.id, entry.path || entry.name]));
  const byUpdatedDesc = (a: Item, b: Item) => b.updatedAt.localeCompare(a.updatedAt);
  const directItems = state.items.filter((item) => item.currentLocationId === location.id).sort(byUpdatedDesc);
  const childItems = state.items
    .filter((item) => item.currentLocationId !== location.id && subtreeIds.has(item.currentLocationId))
    .sort(byUpdatedDesc);
  const totalCount = directItems.length + childItems.length;
  const addHref = toHref('/add') + `?locationId=${encodeURIComponent(location.id)}`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{location.name}</h2>
        <p className="text-sm text-slate-500">{formatLocationType(location.type)} · {location.path || location.name}</p>
        <p className="mt-1 text-sm text-slate-600">含子位置共 {totalCount} 件物品</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={addHref} className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">
          <PackagePlus className="h-4 w-4" />在此位置新增物品
        </a>
        <button type="button" onClick={() => setEditingOpen((open) => !open)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">
          <Pencil className="h-4 w-4" />{editingOpen ? '收合編輯' : '編輯位置'}
        </button>
      </div>

      {editingOpen ? (
        <div className="rounded-2xl border border-teal-100 bg-teal-50 p-3">
          <LocationForm key={location.id} householdId={householdId} editing={location} actorId={userId} deviceId={deviceId} onSaved={() => { setEditingOpen(false); reload(); }} />
        </div>
      ) : null}

      {totalCount === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">這個位置還沒有物品，點「在此位置新增物品」開始收納。</p>
      ) : (
        <div className="space-y-4">
          {directItems.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">此位置的物品</h3>
              <ul className="mt-2 space-y-2">
                {directItems.map((item) => <li key={item.id}><ItemCard item={item} locationPath={pathById.get(item.currentLocationId)} /></li>)}
              </ul>
            </section>
          ) : null}
          {childItems.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">子位置的物品</h3>
              <ul className="mt-2 space-y-2">
                {childItems.map((item) => <li key={item.id}><ItemCard item={item} locationPath={pathById.get(item.currentLocationId)} /></li>)}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
