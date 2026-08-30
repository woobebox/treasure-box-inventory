import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { HouseholdMember, Role } from '../../domain/types';
import { memberStatusLabels, roleLabels } from '../../domain/labels';
import { inviteMember, removeMember } from '../../db/householdRepository';
import { PermissionNotice } from '../../components/PermissionNotice';
import { Button, ConfirmDialog, IconButton } from '../../components/ui';
import { useToast } from '../../components/toast/toastContext';

interface Props {
  householdId: string;
  currentUserId: string;
  currentMember?: HouseholdMember;
  members: HouseholdMember[];
  onChanged: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { show } = useToast();
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => show('無法複製使用者 ID，請手動選取文字。', 'error'));
  }
  return (
    <IconButton type="button" aria-label={copied ? '已複製使用者 ID' : '複製使用者 ID'} onClick={handleCopy} title="複製 ID" className="rounded-xl">
      {copied ? <Check aria-hidden="true" className="h-4 w-4 text-teal-700" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
    </IconButton>
  );
}

export function MemberManagement({ householdId, currentUserId, currentMember, members, onChanged }: Props) {
  const { show } = useToast();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [inviting, setInviting] = useState(false);
  const [removeCandidate, setRemoveCandidate] = useState<HouseholdMember | null>(null);
  const [removing, setRemoving] = useState(false);
  const isAdmin = currentMember?.status === 'active' && currentMember.role === 'admin';

  if (!isAdmin) return <PermissionNotice message="只有家庭管理者可以邀請或移除成員。" />;

  async function submitInvite() {
    setInviting(true);
    try {
      await inviteMember(householdId, userId, currentUserId, role);
      setUserId('');
      show('已邀請家庭成員');
      onChanged();
    } catch (error) {
      show(error instanceof Error ? error.message : '邀請成員失敗', 'error');
    } finally {
      setInviting(false);
    }
  }

  async function confirmRemove() {
    if (!removeCandidate) return;
    setRemoving(true);
    try {
      await removeMember(removeCandidate.id);
      show('已移除家庭成員');
      setRemoveCandidate(null);
      onChanged();
    } catch (error) {
      show(error instanceof Error ? error.message : '移除成員失敗', 'error');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="page-section space-y-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">家庭協作</p><h2 className="mt-1 text-lg font-bold text-slate-900">成員管理</h2></div>
      <form className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_12rem_auto]" onSubmit={(event) => { event.preventDefault(); void submitInvite(); }}>
        <label className="text-sm font-semibold text-slate-700" htmlFor="invite-user-id">使用者 ID<input id="invite-user-id" className="field-control mt-1 w-full font-normal" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="貼上要邀請的使用者 ID" required /></label>
        <label className="text-sm font-semibold text-slate-700" htmlFor="invite-role">角色<select id="invite-role" className="field-control mt-1 w-full font-normal" value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="member">{roleLabels.member}</option><option value="admin">{roleLabels.admin}</option></select></label>
        <Button type="submit" busy={inviting}>邀請成員</Button>
      </form>
      <ul className="divide-y divide-slate-100">
        {members.map((member) => (
          <li key={member.id} className="flex min-h-16 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1">
                <span className="min-w-0 break-all text-sm font-medium text-slate-700">{member.userId}</span>
                <CopyButton text={member.userId} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{roleLabels[member.role]} · {memberStatusLabels[member.status]}</p>
            </div>
            {member.userId !== currentUserId && member.status !== 'removed' ? <Button type="button" variant="danger" size="md" onClick={() => setRemoveCandidate(member)}>移除</Button> : null}
          </li>
        ))}
      </ul>
      <ConfirmDialog open={Boolean(removeCandidate)} title="移除此家庭成員？" description={<>使用者 <strong className="break-all text-slate-800">{removeCandidate?.userId}</strong> 將失去此家庭的存取權。</>} confirmLabel="確認移除" busy={removing} onCancel={() => setRemoveCandidate(null)} onConfirm={() => void confirmRemove()} />
    </section>
  );
}
