import { useEffect, useState } from 'react';
import type { HouseholdMember } from '../../domain/types';
import { getActiveMember, listMembers } from '../../db/householdRepository';
import { useAuth } from '../../services/authContext';
import { useHousehold } from '../../services/householdContextValue';
import { MemberManagement } from './MemberManagement';
import { Button } from '../../components/ui';

export function HouseholdSettingsPage() {
  const { user, isLoading } = useAuth();
  const { households, householdId, selectHousehold, createHousehold } = useHousehold();
  const [members, setMembers] = useState<HouseholdMember[]>([]); const [currentMember, setCurrentMember] = useState<HouseholdMember | undefined>(); const [name, setName] = useState(''); const [message, setMessage] = useState('');
  useEffect(() => { if (!user || !householdId) return; void Promise.all([listMembers(householdId), getActiveMember(householdId, user.id)]).then(([nextMembers, member]) => { setMembers(nextMembers); setCurrentMember(member); }); }, [householdId, user]);
  if (isLoading) return <section className="p-4" aria-live="polite">正在載入帳號...</section>;
  if (!user) return <section className="p-4">請先登入 Supabase，才能管理家庭成員。</section>;
  return <section className="space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">家庭協作</p><h2 className="mt-1 text-xl font-bold text-slate-900">家庭設定</h2></div><form className="page-section space-y-3" onSubmit={(event) => { event.preventDefault(); void createHousehold(name).then(() => { setName(''); setMessage(''); }).catch((error) => setMessage(error instanceof Error ? error.message : '建立家庭失敗')); }}><label className="block text-sm font-semibold text-slate-700" htmlFor="new-household-name">新增家庭</label><div className="flex flex-col gap-2 sm:flex-row"><input id="new-household-name" className="field-control min-w-0 flex-1" value={name} onChange={(event) => setName(event.target.value)} required /><Button type="submit">建立</Button></div>{message ? <p role="alert" className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{message}</p> : null}</form><label className="block text-sm font-semibold text-slate-700" htmlFor="household-select">目前家庭<select id="household-select" className="field-control mt-1 w-full font-normal" value={householdId} onChange={(event) => selectHousehold(event.target.value)}>{households.map((household) => <option key={household.id} value={household.id}>{household.name}</option>)}</select></label>{householdId ? <MemberManagement householdId={householdId} currentUserId={user.id} currentMember={currentMember} members={members} onChanged={() => void listMembers(householdId).then(setMembers)} /> : null}</section>;
}
