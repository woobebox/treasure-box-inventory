import { type FormEvent, useState } from 'react';
import { supabase } from '../../services/supabaseClient';

// Minimal email + password auth screen, shown by App when Supabase is configured
// but no user is signed in. Toggles between sign-in and sign-up on one form.
export function LoginPage() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) { setMessage('尚未設定 Supabase。'); return; }
    setBusy(true); setMessage('');
    try {
      if (mode === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // When email confirmation is on, no session is returned until verified.
        if (!data.session) setMessage('註冊成功，請至信箱完成驗證後再登入。');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '驗證失敗。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">收納寶盒</h1>
        <p className="text-sm text-slate-600">{mode === 'signIn' ? '登入以同步你的家庭庫存。' : '建立帳號以開始使用雲端同步。'}</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} aria-label="電子郵件" placeholder="電子郵件" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
        <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} aria-label="密碼" placeholder="密碼（至少 6 字）" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
        <button type="submit" disabled={busy} className="w-full rounded-2xl bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-60">{busy ? '處理中…' : mode === 'signIn' ? '登入' : '註冊'}</button>
      </form>
      <button type="button" onClick={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setMessage(''); }} className="text-sm text-teal-700 underline">
        {mode === 'signIn' ? '還沒有帳號？前往註冊' : '已有帳號？前往登入'}
      </button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </main>
  );
}
