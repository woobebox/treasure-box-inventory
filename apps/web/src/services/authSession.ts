import type { Session } from '@supabase/supabase-js';
import { authCallbackFailure, clearAuthRedirect } from './authRedirect';
import { initialAuthRedirect, supabase } from './supabaseClient';

export interface AuthInitialization { session: Session | null; loginError: string; }

export async function initializeAuthSession(): Promise<AuthInitialization> {
  if (!supabase) return { session: null, loginError: '' };
  try {
    // The SDK owns PKCE exchange. initialize() exposes callback errors that
    // getSession() alone can hide when it recovers an existing stored session.
    const initialized = await supabase.auth.initialize();
    const { data, error } = await supabase.auth.getSession();
    const unconsumedCode = initialAuthRedirect.hasCode && new URL(window.location.href).searchParams.has('code');
    if (initialized.error || error || initialAuthRedirect.hasError || unconsumedCode || (initialAuthRedirect.isCallback && !data.session)) {
      return { session: null, loginError: initialAuthRedirect.isCallback ? authCallbackFailure : '無法載入登入狀態，請重新登入。' };
    }
    return { session: data.session, loginError: '' };
  } catch {
    return { session: null, loginError: initialAuthRedirect.isCallback ? authCallbackFailure : '無法載入登入狀態，請重新登入。' };
  } finally {
    if (initialAuthRedirect.isCallback) clearAuthRedirect();
  }
}
