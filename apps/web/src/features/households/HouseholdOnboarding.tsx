import { type FormEvent, useState } from 'react';
import { useHousehold } from '../../services/householdContextValue';
import { useAuth } from '../../services/authContext';
import { Button } from '../../components/ui';

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
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-teal-50 to-white p-4 md:p-8">
      <div className="page-surface w-full max-w-lg p-6 md:p-10">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">家庭庫存控制台</p><h1 className="mt-2 text-2xl font-bold text-slate-900">建立你的家庭</h1><p className="mt-2 text-sm leading-6 text-slate-600">家庭是同步與分享的範圍，先建立一個才能開始。</p></div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label htmlFor="onboarding-household-name" className="text-sm font-semibold text-slate-700">家庭名稱</label>
          <input id="onboarding-household-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：我家" className="field-control w-full" />
          <Button type="submit" busy={busy} fullWidth size="lg">建立家庭</Button>
        </form>
        {message && <p aria-live="polite" className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}
        <Button type="button" variant="ghost" fullWidth onClick={() => void signOut()} className="mt-3">登出</Button>
      </div>
    </main>
  );
}
