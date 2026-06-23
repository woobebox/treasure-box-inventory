import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthContext } from './authContext';
import { supabase } from './supabaseClient';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session)).finally(() => setIsLoading(false));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ session, user: session?.user ?? null, isLoading, signOut: async () => { await supabase?.auth.signOut(); } }), [session, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
