import { useEffect, useState } from 'react';
import type { HouseholdMember } from '../../domain/types';
import { getActiveMember, listMembers } from '../../db/householdRepository';
import { useAuth } from '../../services/authContext';
import { useHousehold } from '../../services/householdContextValue';
import { MemberManagement } from './MemberManagement';

export function HouseholdSettingsPage() {
  const { user, isLoading } = useAuth();
  const { households, householdId, selectHousehold, createHousehold } = useHousehold();
  const [members, setMembers] = useState<HouseholdMember[]>([]); const [currentMember, setCurrentMember] = useState<HouseholdMember | undefined>(); const [name, setName] = useState(''); const [message, setMessage] = useState('');
  useEffect(() => { if (!user || !householdId) return; void Promise.all([listMembers(householdId), getActiveMember(householdId, user.id)]).then(([nextMembers, member]) => { setMembers(nextMembers); setCurrentMember(member); }); }, [householdId, user]);
  if (isLoading) return <main className="p-4">正在載入帳號...</main>;
  if (!user) return <main className="p-4">請先登入 Supabase，才能管理家庭成員。</main>;
  return <main className="space-y-4 p-4"><h1 className="text-2xl font-bold">家庭設定</h1><form className="rounded-xl border bg-white p-4" onSubmit={(event) => { event.preventDefault(); void createHousehold(name).then(() => { setName(''); setMessage(''); }).catch((error) => setMessage(error instanceof Error ? error.message : '建立家庭失敗')); }}><label className="block text-sm font-medium">新增家庭</label><input className="mt-1 w-full rounded border p-2" value={name} onChange={(event) => setName(event.target.value)} required /><button className="mt-2 rounded bg-slate-900 px-3 py-2 text-white">建立</button>{message ? <p className="mt-2 text-sm text-rose-600">{message}</p> : null}</form><select className="w-full rounded border p-2" value={householdId} onChange={(event) => selectHousehold(event.target.value)}>{households.map((household) => <option key={household.id} value={household.id}>{household.name}</option>)}</select>{householdId ? <MemberManagement householdId={householdId} currentUserId={user.id} currentMember={currentMember} members={members} onChanged={() => void listMembers(householdId).then(setMembers)} /> : null}</main>;
}
