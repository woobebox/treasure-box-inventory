import { type FormEvent, useState } from 'react';
import { useHousehold } from '../../services/householdContextValue';
import { useAuth } from '../../services/authContext';

// Shown after sign-in when the user belongs to no household yet. Creating one
// calls the create_household RPC (see migration 006) and selects it.
export function HouseholdOnboarding() {
  const { createHousehold } = useHousehold();
  const { signOut } = useAuth();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      await createHousehold(name);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '建立家庭失敗。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">建立你的家庭</h1>
        <p className="text-sm text-slate-600">家庭是同步與分享的範圍，先建立一個才能開始。</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input required value={name} onChange={(event) => setName(event.target.value)} aria-label="家庭名稱" placeholder="例如：我家" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
        <button type="submit" disabled={busy} className="w-full rounded-2xl bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-60">{busy ? '建立中…' : '建立家庭'}</button>
      </form>
      {message && <p className="text-sm text-rose-600">{message}</p>}
      <button type="button" onClick={() => void signOut()} className="text-sm text-slate-500 underline">登出</button>
    </main>
  );
}
