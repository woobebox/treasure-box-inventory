import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthContext } from './authContext';
import { supabase } from './supabaseClient';
import { initializeAuthSession, type AuthInitialization } from './authSession';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [loginError, setLoginError] = useState('');
  const initialization = useRef<Promise<AuthInitialization> | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let ready = false;
    let authenticated = false;
    initialization.current ??= initializeAuthSession();
    void initialization.current.then((result) => {
      if (!active) return;
      setSession(result.session);
      setLoginError(result.loginError);
      setIsLoading(false);
      authenticated = Boolean(result.session);
      ready = true;
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active || !ready || event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_IN') authenticated = true;
      else if (event === 'SIGNED_OUT') authenticated = false;
      else if (!authenticated) return;
      setSession(nextSession);
      setLoginError('');
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const value = useMemo(() => ({ session, user: session?.user ?? null, isLoading, loginError, signOut: async () => {
    const result = await supabase?.auth.signOut();
    if (result?.error) throw new Error('登出失敗，請重試。');
  } }), [session, isLoading, loginError]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
