import { useState } from 'react';
import type { HouseholdMember, Role } from '../../domain/types';
import { memberStatusLabels, roleLabels } from '../../domain/labels';
import { inviteMember, removeMember } from '../../db/householdRepository';
import { PermissionNotice } from '../../components/PermissionNotice';

interface Props {
  householdId: string;
  currentUserId: string;
  currentMember?: HouseholdMember;
  members: HouseholdMember[];
  onChanged: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1 rounded p-1 text-slate-400 hover:text-slate-700"
      title="複製 ID"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 2a2 2 0 00-2 2v1H5a2 2 0 00-2 2v9a2 2 0 002 2h8a2 2 0 002-2v-1h1a2 2 0 002-2V7a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H8zm0 2h4v1H8V4zm-3 3h10v9H5V7z" />
        </svg>
      )}
    </button>
  );
}

export function MemberManagement({ householdId, currentUserId, currentMember, members, onChanged }: Props) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<Role>('member');
  const isAdmin = currentMember?.status === 'active' && currentMember.role === 'admin';

  if (!isAdmin) return <PermissionNotice message="只有家庭管理者可以邀請或移除成員。" />;

  return (
    <section className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">成員管理</h2>
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void inviteMember(householdId, userId, currentUserId, role).then(() => {
            setUserId('');
            onChanged();
          });
        }}
      >
        <input
          className="rounded border p-2"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="要邀請的使用者 ID"
          required
        />
        <select
          className="rounded border p-2"
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
        >
          <option value="member">{roleLabels.member}</option>
          <option value="admin">{roleLabels.admin}</option>
        </select>
        <button className="rounded bg-slate-900 px-3 py-2 text-white">邀請成員</button>
      </form>
      <ul className="divide-y">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between py-2">
            <div className="flex min-w-0 items-center gap-1">
              <span className="truncate text-sm text-slate-700">{member.userId}</span>
              <CopyButton text={member.userId} />
              <span className="text-slate-400">·</span>
              <span className="text-sm">{roleLabels[member.role]}</span>
              <span className="text-slate-400">·</span>
              <span className="text-sm">{memberStatusLabels[member.status]}</span>
            </div>
            {member.userId !== currentUserId && member.status !== 'removed' ? (
              <button
                className="ml-2 shrink-0 text-sm text-red-700"
                onClick={() => void removeMember(member.id).then(onChanged)}
              >
                移除
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
