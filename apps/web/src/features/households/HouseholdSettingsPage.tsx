import { useEffect, useState } from 'react';
import type { Household, HouseholdMember } from '../../domain/types';
import { createHousehold, getActiveMember, listHouseholdsForUser, listMembers } from '../../db/householdRepository';
import { useAuth } from '../../services/auth';
import { MemberManagement } from './MemberManagement';

export function HouseholdSettingsPage() {
  const { user, isLoading } = useAuth(); const [households, setHouseholds] = useState<Household[]>([]); const [active, setActive] = useState<Household | null>(null); const [members, setMembers] = useState<HouseholdMember[]>([]); const [currentMember, setCurrentMember] = useState<HouseholdMember | undefined>(); const [name, setName] = useState('');
  const reload = () => { if (!user) return; void listHouseholdsForUser(user.id).then((rows) => { setHouseholds(rows); setActive((current) => current ?? rows[0] ?? null); }); };
  useEffect(reload, [user]);
  useEffect(() => { if (!user || !active) return; void Promise.all([listMembers(active.id), getActiveMember(active.id, user.id)]).then(([nextMembers, member]) => { setMembers(nextMembers); setCurrentMember(member); }); }, [active, user]);
  if (isLoading) return <main className="p-4">Loading account…</main>;
  if (!user) return <main className="p-4">Sign in with Supabase to manage household membership.</main>;
  return <main className="space-y-4 p-4"><h1 className="text-2xl font-bold">Household settings</h1><form className="rounded-xl border bg-white p-4" onSubmit={(event) => { event.preventDefault(); void createHousehold(name, user.id).then((created) => { setName(''); setActive(created); reload(); }); }}><label className="block text-sm font-medium">New household</label><input className="mt-1 w-full rounded border p-2" value={name} onChange={(event) => setName(event.target.value)} required /><button className="mt-2 rounded bg-slate-900 px-3 py-2 text-white">Create</button></form><select className="w-full rounded border p-2" value={active?.id ?? ''} onChange={(event) => setActive(households.find((household) => household.id === event.target.value) ?? null)}>{households.map((household) => <option key={household.id} value={household.id}>{household.name}</option>)}</select>{active ? <MemberManagement householdId={active.id} currentUserId={user.id} currentMember={currentMember} members={members} onChanged={() => void listMembers(active.id).then(setMembers)} /> : null}</main>;
}
