import { useEffect, useState } from 'react';
import { db } from '../../db/database';
import { listItemsByHousehold } from '../../db/itemRepository';
import { listLocationsByHousehold } from '../../db/locationRepository';
import type { Item } from '../../domain/types';
import { useHousehold } from '../../services/householdContextValue';
import { ItemCard } from '../items/ItemCard';

interface RecentItem {
  item: Item;
  locationPath: string | null;
}

export function HomePage() {
  const { householdId, householdName } = useHousehold();
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [syncCount, setSyncCount] = useState(0);

  useEffect(() => {
    void Promise.all([
      listItemsByHousehold(householdId),
      listLocationsByHousehold(householdId),
      db.syncOps.where('householdId').equals(householdId).filter((op) => op.status !== 'synced').count(),
    ]).then(([items, locations, unsynced]) => {
      const locationPathById = new Map(locations.map((location) => [location.id, location.path]));
      const sorted = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setRecent(sorted.slice(0, 5).map((item) => ({
        item,
        locationPath: locationPathById.get(item.currentLocationId) ?? null,
      })));
      setSyncCount(unsynced);
    });
  }, [householdId]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-teal-50 p-3">
        <p className="text-xs uppercase tracking-wide text-teal-700">目前家庭</p>
        <p className="font-semibold text-slate-900">{householdName || '本機示範家庭'}</p>
        <p className="text-sm text-slate-600">{syncCount} 筆待同步作業</p>
      </div>
      <section>
        <h2 className="font-semibold text-slate-900">最近物品</h2>
        <ul className="mt-2 space-y-2">
          {recent.map(({ item, locationPath }) => <li key={item.id}><ItemCard item={item} locationPath={locationPath} /></li>)}
        </ul>
        {recent.length === 0 ? <p className="text-sm text-slate-500">目前沒有本機物品。</p> : null}
      </section>
    </div>
  );
}
