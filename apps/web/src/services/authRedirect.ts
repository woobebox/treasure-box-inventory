const authParameters = ['code', 'error', 'error_code', 'error_description', 'access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type', 'provider_token', 'provider_refresh_token', 'type'];

export interface AuthRedirect { isCallback: boolean; hasCode: boolean; hasError: boolean; }

export function readAuthRedirect(url: URL): AuthRedirect {
  const hash = new URLSearchParams(url.hash.slice(1));
  const has = (key: string) => url.searchParams.has(key) || hash.has(key);
  const hasCode = has('code');
  const hasError = ['error', 'error_code', 'error_description'].some(has);
  return { isCallback: hasCode || hasError || has('access_token') || has('refresh_token'), hasCode, hasError };
}

export function clearAuthRedirect(): void {
  const url = new URL(window.location.href);
  if (!readAuthRedirect(url).isCallback) return;
  for (const key of authParameters) url.searchParams.delete(key);
  const hash = new URLSearchParams(url.hash.slice(1));
  if (authParameters.some((key) => hash.has(key))) {
    for (const key of authParameters) hash.delete(key);
    url.hash = hash.toString();
  }
  window.history.replaceState(window.history.state, '', url.toString());
}

export function authReturnUrl(origin = window.location.origin, base = import.meta.env.BASE_URL): string {
  return new URL(base, origin).toString();
}

export const authCallbackFailure = '無法完成登入，請重新嘗試 Google 登入。若你剛完成信箱驗證，請使用 Email／密碼登入，不需重新註冊。';
