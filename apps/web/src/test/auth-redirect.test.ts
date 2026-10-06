import { beforeEach, describe, expect, it } from 'vitest';
import { authReturnUrl, clearAuthRedirect, readAuthRedirect } from '../services/authRedirect';

describe('auth redirect', () => {
  beforeEach(() => window.history.replaceState({ retained: true }, '', '/'));

  it('returns the app entry for local and Pages deployments', () => {
    expect(authReturnUrl('http://localhost:5173', '/')).toBe('http://localhost:5173/');
    expect(authReturnUrl('https://woobebox.github.io', '/treasure-box-inventory/')).toBe('https://woobebox.github.io/treasure-box-inventory/');
  });

  it('cleans a failed callback without removing unrelated query, anchor or state', () => {
    window.history.replaceState({ retained: true }, '', '/?code=secret&error=denied&error_description=private&view=list#inventory');
    expect(readAuthRedirect(new URL(window.location.href))).toEqual({ isCallback: true, hasCode: true, hasError: true });
    clearAuthRedirect();
    expect(window.location.search).toBe('?view=list');
    expect(window.location.hash).toBe('#inventory');
    expect(window.history.state).toEqual({ retained: true });
  });

  it('removes legacy tokens and provider tokens from fragments', () => {
    window.history.replaceState({}, '', '/#access_token=secret&refresh_token=secret&provider_token=secret&expires_in=3600&type=signup');
    clearAuthRedirect();
    expect(window.location.hash).toBe('');
  });

  it('leaves ordinary app navigation unchanged', () => {
    window.history.replaceState({}, '', '/search?view=list#details');
    clearAuthRedirect();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/search?view=list#details');
  });
});
