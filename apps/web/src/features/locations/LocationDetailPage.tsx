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
import { ActionLink, Button } from '../../components/ui';
import { EmptyState, ErrorState, LoadingState } from '../../components/StatusState';

interface Props { locationId: string; }
interface DetailState { location: Location | null; locations: Location[]; items: Item[]; loaded: boolean; }

export function LocationDetailPage({ locationId }: Props) {
  const { householdId, userId, deviceId } = useHousehold();
  const [state, setState] = useState<DetailState>({ location: null, locations: [], items: [], loaded: false });
  const [editingOpen, setEditingOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload(): void {
    void Promise.all([listLocationsByHousehold(householdId), listItemsByHousehold(householdId)]).then(([locations, items]) => {
      setState({ location: locations.find((location) => location.id === locationId) ?? null, locations, items, loaded: true });
      setError(null);
    }).catch((cause: unknown) => { setError(cause instanceof Error ? cause.message : '無法載入位置'); setState((current) => ({ ...current, loaded: true })); });
  }

  useEffect(() => {
    let active = true;
    void Promise.all([listLocationsByHousehold(householdId), listItemsByHousehold(householdId)]).then(([locations, items]) => {
      if (active) { setState({ location: locations.find((location) => location.id === locationId) ?? null, locations, items, loaded: true }); setError(null); }
    }).catch((cause: unknown) => { if (active) { setError(cause instanceof Error ? cause.message : '無法載入位置'); setState((current) => ({ ...current, loaded: true })); } });
    return () => { active = false; };
  }, [householdId, locationId]);

  if (!state.loaded) return <LoadingState label="正在載入位置資料…" rows={3} />;
  if (error) return <ErrorState title="無法載入位置" message={error} actionLabel="重試" onAction={() => { setState((current) => ({ ...current, loaded: false })); reload(); }} />;
  if (!state.location) {
    return (
      <div className="space-y-4"><EmptyState title="找不到這個位置" message="這個位置可能已被移除，或不屬於目前家庭。" /><ActionLink href={toHref('/locations')}>回位置管理</ActionLink></div>
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
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="page-section bg-gradient-to-br from-white to-teal-50/60">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">位置詳情</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{location.name}</h2>
        <p className="mt-2 text-sm text-slate-600">{formatLocationType(location.type)} · {location.path || location.name}</p>
        <p className="mt-1 text-sm font-medium text-teal-800">含子位置共 {totalCount} 件物品</p>
      </section>

      <div className="flex flex-wrap gap-3">
        <ActionLink href={addHref} variant="primary" leadingIcon={<PackagePlus aria-hidden="true" className="h-5 w-5" />}>在此位置新增物品</ActionLink>
        <Button type="button" variant="secondary" leadingIcon={<Pencil aria-hidden="true" className="h-5 w-5" />} onClick={() => setEditingOpen((open) => !open)}>{editingOpen ? '收合編輯' : '編輯位置'}</Button>
      </div>

      {editingOpen ? (
        <div className="rounded-3xl border border-teal-100 bg-teal-50/60 p-3">
          <LocationForm key={location.id} householdId={householdId} editing={location} actorId={userId} deviceId={deviceId} onSaved={() => { setEditingOpen(false); reload(); }} />
        </div>
      ) : null}

      {totalCount === 0 ? (
        <div className="rounded-3xl border border-dashed border-teal-200 bg-teal-50/50 p-8 text-center"><PackagePlus aria-hidden="true" className="mx-auto h-8 w-8 text-teal-600" /><p className="mt-3 font-semibold text-slate-900">這個位置還沒有物品</p><p className="mt-1 text-sm text-slate-600">點擊上方按鈕開始收納。</p></div>
      ) : (
        <div className="space-y-4">
          {directItems.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">此位置的物品</h3>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {directItems.map((item) => <li key={item.id}><ItemCard item={item} locationPath={pathById.get(item.currentLocationId)} /></li>)}
              </ul>
            </section>
          ) : null}
          {childItems.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">子位置的物品</h3>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {childItems.map((item) => <li key={item.id}><ItemCard item={item} locationPath={pathById.get(item.currentLocationId)} /></li>)}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
