import { createClient } from '@supabase/supabase-js';
import { readAuthRedirect } from './authRedirect';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Capture before the SDK consumes the code or removes callback parameters.
export const initialAuthRedirect = readAuthRedirect(new URL(window.location.href));
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }
}) : null;
