import { type FormEvent, useEffect, useRef, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Button } from '../../components/ui';
import { Eye, EyeOff } from 'lucide-react';
import { IconButton } from '../../components/ui';
import { useAuth } from '../../services/authContext';
import { authReturnUrl } from '../../services/authRedirect';

// Both entry points share the same Supabase session and submission lock.
export function LoginPage() {
  const { loginError } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(loginError);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('error');
  const submitting = useRef(false);

  useEffect(() => {
    // Browser Back from Google can restore this page from the back/forward
    // cache, including its locked state, without remounting React.
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      submitting.current = false;
      setBusy(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  async function signInWithGoogle() {
    if (submitting.current) return;
    if (!supabase) { setMessageTone('error'); setMessage('尚未設定 Supabase。'); return; }
    submitting.current = true;
    setBusy(true); setMessage('');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: authReturnUrl() } });
      if (error || !data.url) throw new Error('oauth_failed');
      // Keep both entry points locked until the current page navigates away.
    } catch {
      setMessageTone('error');
      setMessage('無法啟動 Google 登入，請稍後重試，或使用 Email／密碼登入。');
      submitting.current = false;
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (!supabase) { setMessageTone('error'); setMessage('尚未設定 Supabase。'); return; }
    submitting.current = true;
    setBusy(true); setMessage('');
    try {
      if (mode === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: authReturnUrl() } });
        if (error) throw error;
        // When email confirmation is on, no session is returned until verified.
        if (!data.session) { setMessageTone('success'); setMessage('註冊成功，請至信箱完成驗證後再登入。'); }
      }
    } catch {
      setMessageTone('error');
      setMessage('驗證失敗，請檢查電子郵件與密碼後重試。若原本使用 Google 註冊，請選擇 Google 登入。');
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-white p-4 md:p-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-teal-100 bg-white shadow-[0_24px_70px_rgb(15_118_110/0.14)] md:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-teal-700 to-teal-950 p-8 text-white md:flex">
          <div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold ring-1 ring-white/25">寶</span><p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">家庭庫存控制台</p><h1 className="mt-2 text-3xl font-bold">收納寶盒</h1></div>
          <p className="max-w-xs text-sm leading-6 text-teal-50/85">把家中的物品、照片與位置整理在一個離線也可靠的空間裡。</p>
        </div>
        <div className="p-6 md:p-10">
          <div className="md:hidden"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">家庭庫存控制台</p><h1 className="mt-2 text-2xl font-bold text-slate-900">收納寶盒</h1></div>
          <div className="mt-2 md:mt-0"><h2 className="text-xl font-bold text-slate-900">{mode === 'signIn' ? '歡迎回來' : '建立你的家庭庫存'}</h2><p className="mt-1 text-sm text-slate-600">{mode === 'signIn' ? '登入以同步你的家庭庫存。' : '建立帳號以開始使用雲端同步。'}</p></div>
          <Button type="button" variant="secondary" fullWidth size="lg" busy={busy} onClick={() => void signInWithGoogle()} className="mt-6">使用 Google 登入</Button>
          <p className="mt-4 text-center text-sm text-slate-600">或使用 Email／密碼</p>
          <form onSubmit={submit} className="mt-4 space-y-4" aria-busy={busy}>
            <div><label htmlFor="login-email" className="text-sm font-semibold text-slate-700">電子郵件</label><input id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="field-control mt-1 w-full" /></div>
            <div><label htmlFor="login-password" className="text-sm font-semibold text-slate-700">密碼</label><div className="mt-1 grid grid-cols-[minmax(0,1fr)_3rem] gap-2"><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 字" className="field-control w-full" /><IconButton type="button" aria-label={showPassword ? '隱藏密碼' : '顯示密碼'} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}</IconButton></div></div>
            <Button type="submit" busy={busy} fullWidth size="lg">{mode === 'signIn' ? '登入' : '註冊'}</Button>
          </form>
          <Button type="button" variant="ghost" size="md" fullWidth disabled={busy} onClick={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setMessage(''); }} className="mt-3">
            {mode === 'signIn' ? '還沒有帳號？前往註冊' : '已有帳號？前往登入'}
          </Button>
          {message && <p role={messageTone === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-2xl p-3 text-sm leading-5 ${messageTone === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-teal-50 text-teal-800'}`}>{message}</p>}
        </div>
      </div>
    </main>
  );
}
