import { StrictMode } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  redirect: { isCallback: false, hasCode: false, hasError: false },
  initialize: vi.fn(), getSession: vi.fn(), onAuthStateChange: vi.fn(), unsubscribe: vi.fn(), signOut: vi.fn()
}));
vi.mock('../services/supabaseClient', () => ({ initialAuthRedirect: mocks.redirect, supabase: { auth: mocks } }));

import { initializeAuthSession } from '../services/authSession';
import { authCallbackFailure } from '../services/authRedirect';
import { AuthProvider } from '../services/auth';
import { useAuth } from '../services/authContext';

const session = { user: { id: 'user-a' } } as Session;
function Probe() {
  const auth = useAuth();
  return <p>{auth.isLoading ? 'loading' : auth.user?.id ?? 'signed-out'}:{auth.loginError}</p>;
}

describe('auth initialization', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.assign(mocks.redirect, { isCallback: false, hasCode: false, hasError: false });
    window.history.replaceState({}, '', '/');
    mocks.initialize.mockResolvedValue({ error: null });
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mocks.unsubscribe } } });
  });
  afterEach(cleanup);

  it('lets the SDK consume a callback, then returns its session and cleans parameters', async () => {
    Object.assign(mocks.redirect, { isCallback: true, hasCode: true });
    window.history.replaceState({}, '', '/?code=once&error_code=');
    mocks.initialize.mockImplementation(async () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      window.history.replaceState({}, '', url);
      return { error: null };
    });
    expect(await initializeAuthSession()).toEqual({ session, loginError: '' });
    expect(window.location.search).toBe('');
    expect(mocks.initialize).toHaveBeenCalledTimes(1);
  });

  it.each(['denied', 'expired', 'network'])('safely handles %s without exposing raw errors', async () => {
    Object.assign(mocks.redirect, { isCallback: true, hasCode: true });
    window.history.replaceState({}, '', '/?code=secret');
    mocks.initialize.mockResolvedValue({ error: new Error('private-provider-secret') });
    expect(await initializeAuthSession()).toEqual({ session: null, loginError: authCallbackFailure });
    expect(window.location.search).toBe('');
  });

  it('rejects an unconsumed code even when an older session exists (missing verifier)', async () => {
    Object.assign(mocks.redirect, { isCallback: true, hasCode: true });
    window.history.replaceState({}, '', '/?code=cross-device');
    const result = await initializeAuthSession();
    expect(result.session).toBeNull();
    expect(result.loginError).toContain('不需重新註冊');
    expect(window.location.search).toBe('');
  });

  it('handles a provider denial in a fragment and removes its description', async () => {
    Object.assign(mocks.redirect, { isCallback: true, hasError: true });
    window.history.replaceState({}, '', '/#error=access_denied&error_description=private');
    expect((await initializeAuthSession()).loginError).toBe(authCallbackFailure);
    expect(window.location.hash).toBe('');
  });

  it('handles no session after a callback and rejected initialization', async () => {
    Object.assign(mocks.redirect, { isCallback: true });
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect((await initializeAuthSession()).loginError).toBe(authCallbackFailure);
    mocks.initialize.mockRejectedValue(new Error('network-secret'));
    expect((await initializeAuthSession()).loginError).toBe(authCallbackFailure);
  });

  it('initializes once in StrictMode and ignores stale INITIAL_SESSION notifications', async () => {
    render(<StrictMode><AuthProvider><Probe /></AuthProvider></StrictMode>);
    await screen.findByText('user-a:');
    expect(mocks.initialize).toHaveBeenCalledTimes(1);
    const listener = mocks.onAuthStateChange.mock.calls.at(-1)![0];
    act(() => listener('INITIAL_SESSION', { user: { id: 'stale' } }));
    expect(screen.getByText('user-a:')).toBeInTheDocument();
    act(() => listener('SIGNED_OUT', null));
    await waitFor(() => expect(screen.getByText('signed-out:')).toBeInTheDocument());
    act(() => listener('SIGNED_IN', { user: { id: 'user-b' } }));
    expect(screen.getByText('user-b:')).toBeInTheDocument();
  });

  it('leaves loading visible until initialization completes, then recovers from callback failure via login', async () => {
    let resolve!: (value: { error: Error }) => void;
    mocks.initialize.mockReturnValue(new Promise((done) => { resolve = done; }));
    Object.assign(mocks.redirect, { isCallback: true, hasCode: true });
    window.history.replaceState({}, '', '/?code=expired');
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByText('loading:')).toBeInTheDocument();
    const listener = mocks.onAuthStateChange.mock.calls[0][0];
    act(() => listener('INITIAL_SESSION', session));
    expect(screen.getByText('loading:')).toBeInTheDocument();
    await act(async () => resolve({ error: new Error('expired-private') }));
    expect(screen.getByText(`signed-out:${authCallbackFailure}`)).toBeInTheDocument();
    act(() => listener('TOKEN_REFRESHED', session));
    expect(screen.getByText(`signed-out:${authCallbackFailure}`)).toBeInTheDocument();
    act(() => listener('SIGNED_IN', session));
    expect(screen.getByText('user-a:')).toBeInTheDocument();
  });
});
