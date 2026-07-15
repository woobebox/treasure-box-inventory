import { useEffect, useState } from 'react';
import { AlertTriangle, Check, CloudOff, RefreshCw } from 'lucide-react';
import { listItemsByHousehold } from '../../db/itemRepository';
import { listLocationsByHousehold } from '../../db/locationRepository';
import type { Item } from '../../domain/types';
import { useHousehold } from '../../services/householdContextValue';
import { requestSync } from '../../sync/syncScheduler';
import { useSyncStatus } from '../../sync/useSyncStatus';
import { ItemCard } from '../items/ItemCard';

interface RecentItem {
  item: Item;
  locationPath: string | null;
}

function SyncIndicator() {
  const sync = useSyncStatus();
  if (!sync.enabled) {
    return (
      <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-500">
        <CloudOff className="h-4 w-4" />純離線模式
      </p>
    );
  }
  const syncing = sync.phase === 'syncing';
  const Icon = syncing ? RefreshCw : sync.phase === 'error' ? AlertTriangle : Check;
  const tone = sync.phase === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-teal-100 text-teal-800';
  return (
    <button
      type="button"
      onClick={() => void requestSync('manual')}
      disabled={syncing}
      aria-label="立即同步"
      className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${tone}`}
    >
      <Icon className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? '同步中…' : sync.pendingCount > 0 ? `${sync.pendingCount} 筆待同步` : sync.phase === 'error' ? '同步發生問題' : '已同步'}
    </button>
  );
}

export function HomePage() {
  const { householdId, householdName } = useHousehold();
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const sync = useSyncStatus();

  // Reload after each sync settles so remote changes show up without a refresh.
  useEffect(() => {
    if (sync.phase === 'syncing') return;
    void Promise.all([
      listItemsByHousehold(householdId),
      listLocationsByHousehold(householdId),
    ]).then(([items, locations]) => {
      const locationPathById = new Map(locations.map((location) => [location.id, location.path]));
      const sorted = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setRecent(sorted.slice(0, 5).map((item) => ({
        item,
        locationPath: locationPathById.get(item.currentLocationId) ?? null,
      })));
    });
  }, [householdId, sync.phase]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-teal-50 p-3">
        <p className="text-xs uppercase tracking-wide text-teal-700">目前家庭</p>
        <p className="font-semibold text-slate-900">{householdName || '本機示範家庭'}</p>
        <SyncIndicator />
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
