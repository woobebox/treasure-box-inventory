import { useEffect, useState } from 'react';
import { db } from '../../db/database';
import { listItemsByHousehold } from '../../db/itemRepository';
import type { Item } from '../../domain/types';
import { useHousehold } from '../../services/householdContextValue';
import { ItemCard } from '../items/ItemCard';

export function HomePage() {
  const { householdId, householdName } = useHousehold();
  const [recent, setRecent] = useState<Item[]>([]); const [syncCount, setSyncCount] = useState(0);
  useEffect(() => { void Promise.all([listItemsByHousehold(householdId), db.syncOps.where('householdId').equals(householdId).filter((op) => op.status === 'pending').count()]).then(([items, pending]) => { const sorted = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); setRecent(sorted.slice(0, 5)); setSyncCount(pending); }); }, [householdId]);
  return <div className="space-y-4"><div className="rounded-2xl bg-teal-50 p-3"><p className="text-xs uppercase tracking-wide text-teal-700">目前家庭</p><p className="font-semibold text-slate-900">{householdName || '本機示範家庭'}</p><p className="text-sm text-slate-600">{syncCount} 筆待同步作業</p></div><section><h2 className="font-semibold text-slate-900">最近物品</h2><ul className="mt-2 space-y-2">{recent.map((item) => <li key={item.id}><ItemCard item={item} /></li>)}</ul>{recent.length === 0 ? <p className="text-sm text-slate-500">目前沒有本機物品。</p> : null}</section></div>;
}
