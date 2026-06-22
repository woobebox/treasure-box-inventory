import { useEffect, useState } from 'react';
import { db } from '../../db/database';
import { listItemsByHousehold } from '../../db/itemRepository';
import type { Item } from '../../domain/types';

const demoHouseholdId = 'local-demo-household';

export function HomePage() {
  const [recent, setRecent] = useState<Item[]>([]); const [syncCount, setSyncCount] = useState(0); const [reminders, setReminders] = useState<Item[]>([]);
  useEffect(() => { void Promise.all([listItemsByHousehold(demoHouseholdId), db.syncOps.where('householdId').equals(demoHouseholdId).filter((op) => op.status === 'pending').count()]).then(([items, pending]) => { const sorted = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); setRecent(sorted.slice(0, 5)); setReminders(sorted.filter((item) => item.dueAt && item.dueAt <= new Date(Date.now() + 7 * 86400000).toISOString()).slice(0, 5)); setSyncCount(pending); }); }, []);
  return <div className="space-y-4"><div className="rounded-2xl bg-teal-50 p-3"><p className="text-xs uppercase tracking-wide text-teal-700">Current household</p><p className="font-semibold text-slate-900">{demoHouseholdId}</p><p className="text-sm text-slate-600">{syncCount} pending sync operation{syncCount === 1 ? '' : 's'}</p></div><section><h2 className="font-semibold text-slate-900">Recent items</h2><ul className="mt-2 space-y-2">{recent.map((item) => <li key={item.id}><a className="block rounded-xl border border-slate-200 p-3 text-sm text-slate-700" href={`/items/${item.id}`}>{item.name}<span className="block text-xs text-slate-500">{item.category}</span></a></li>)}</ul>{recent.length === 0 ? <p className="text-sm text-slate-500">No local items yet.</p> : null}</section><section><h2 className="font-semibold text-slate-900">Upcoming reminders</h2>{reminders.length ? <ul className="mt-2 space-y-1 text-sm text-slate-600">{reminders.map((item) => <li key={item.id}>{item.name} · {item.dueAt}</li>)}</ul> : <p className="text-sm text-slate-500">No due items in the next week.</p>}</section></div>;
}
