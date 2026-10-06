import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => mocks);

describe('auth client configuration', () => {
  beforeEach(() => { vi.resetModules(); vi.resetAllMocks(); window.history.replaceState({}, '', '/'); });
  afterEach(() => vi.unstubAllEnvs());

  it('enables PKCE and captures the callback before SDK initialization can consume it', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-public-key');
    window.history.replaceState({}, '', '/?code=once');
    mocks.createClient.mockImplementation(() => { window.history.replaceState({}, '', '/'); return {}; });
    const client = await import('../services/supabaseClient');
    expect(client.initialAuthRedirect).toEqual({ isCallback: true, hasCode: true, hasError: false });
    expect(mocks.createClient).toHaveBeenCalledWith('https://example.supabase.co', 'test-public-key', { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
  });

  it('preserves pure offline mode when Supabase is not configured', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect((await import('../services/supabaseClient')).supabase).toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
