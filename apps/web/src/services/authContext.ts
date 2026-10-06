import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface AuthContextValue { session: Session | null; user: User | null; isLoading: boolean; loginError: string; signOut: () => Promise<void>; }
export const AuthContext = createContext<AuthContextValue>({ session: null, user: null, isLoading: Boolean(supabase), loginError: '', signOut: async () => undefined });
export function useAuth() { return useContext(AuthContext); }
