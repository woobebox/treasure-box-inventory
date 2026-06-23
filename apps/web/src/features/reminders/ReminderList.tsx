import { useEffect, useState } from 'react';
import { listItemsByHousehold } from '../../db/itemRepository';
import type { Item } from '../../domain/types';

interface ReminderListProps { householdId: string; days?: number; }

export function ReminderList({ householdId, days = 7 }: ReminderListProps) {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { const cutoff = new Date(Date.now() + days * 86400000).toISOString(); void listItemsByHousehold(householdId).then((all) => setItems(all.filter((item) => item.dueAt && item.dueAt <= cutoff && item.status === 'active').sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt))))); }, [days, householdId]);
  return <section><h2 className="font-semibold text-slate-900">Upcoming reminders</h2>{items.length ? <ul className="mt-2 space-y-1 text-sm text-slate-600">{items.map((item) => <li key={item.id}>{item.name} · {item.dueAt}</li>)}</ul> : <p className="text-sm text-slate-500">No due items in the next {days} days.</p>}</section>;
}
