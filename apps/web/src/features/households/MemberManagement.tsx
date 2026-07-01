import { useState } from 'react';
import type { HouseholdMember, Role } from '../../domain/types';
import { memberStatusLabels, roleLabels } from '../../domain/labels';
import { inviteMember, removeMember } from '../../db/householdRepository';
import { PermissionNotice } from '../../components/PermissionNotice';

interface Props { householdId: string; currentUserId: string; currentMember?: HouseholdMember; members: HouseholdMember[]; onChanged: () => void; }
export function MemberManagement({ householdId, currentUserId, currentMember, members, onChanged }: Props) {
  const [userId, setUserId] = useState(''); const [role, setRole] = useState<Role>('member'); const isAdmin = currentMember?.status === 'active' && currentMember.role === 'admin';
  if (!isAdmin) return <PermissionNotice message="只有家庭管理者可以邀請或移除成員。" />;
  return <section className="space-y-3 rounded-xl border bg-white p-4 shadow-sm"><h2 className="text-lg font-semibold">成員管理</h2><form className="flex flex-col gap-2" onSubmit={(event) => { event.preventDefault(); void inviteMember(householdId, userId, currentUserId, role).then(() => { setUserId(''); onChanged(); }); }}><input className="rounded border p-2" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="要邀請的使用者 ID" required /><select className="rounded border p-2" value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="member">{roleLabels.member}</option><option value="admin">{roleLabels.admin}</option></select><button className="rounded bg-slate-900 px-3 py-2 text-white">邀請成員</button></form><ul className="divide-y">{members.map((member) => <li className="flex items-center justify-between py-2" key={member.id}><span>{member.userId} · {roleLabels[member.role]} · {memberStatusLabels[member.status]}</span>{member.userId !== currentUserId && member.status !== 'removed' ? <button className="text-sm text-red-700" onClick={() => void removeMember(member.id).then(onChanged)}>移除</button> : null}</li>)}</ul></section>;
}
