import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface AuthContextValue { session: Session | null; user: User | null; isLoading: boolean; signOut: () => Promise<void>; }
export const AuthContext = createContext<AuthContextValue>({ session: null, user: null, isLoading: Boolean(supabase), signOut: async () => undefined });
export function useAuth() { return useContext(AuthContext); }
