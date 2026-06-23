import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

interface AuthContextValue { session: Session | null; user: User | null; isLoading: boolean; signOut: () => Promise<void>; }
const AuthContext = createContext<AuthContextValue>({ session: null, user: null, isLoading: true, signOut: async () => undefined });
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null); const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setIsLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session)).finally(() => setIsLoading(false));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);
  const value = useMemo(() => ({ session, user: session?.user ?? null, isLoading, signOut: async () => { await supabase?.auth.signOut(); } }), [session, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
