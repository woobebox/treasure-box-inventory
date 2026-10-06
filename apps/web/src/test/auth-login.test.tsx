import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ signInWithOAuth: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn() }));
vi.mock('../services/supabaseClient', () => ({ supabase: { auth: mocks } }));
import { LoginPage } from '../features/auth/LoginPage';

describe('dual login', () => {
  beforeEach(() => { vi.resetAllMocks(); window.history.replaceState({}, '', '/'); });
  afterEach(cleanup);

  it('shows Google on both login and signup, outside the required Email form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: '使用 Google 登入' }).closest('form')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '還沒有帳號？前往註冊' }));
    expect(screen.getByRole('button', { name: '使用 Google 登入' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '註冊' })).toBeInTheDocument();
  });

  it('starts Google without Email/password and prevents duplicate or competing submissions', async () => {
    let resolve!: (result: { data: { url: string }; error: null }) => void;
    mocks.signInWithOAuth.mockReturnValue(new Promise((done) => { resolve = done; }));
    render(<LoginPage />);
    const button = screen.getByRole('button', { name: '使用 Google 登入' });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.submit(screen.getByLabelText('電子郵件').closest('form')!);
    expect(mocks.signInWithOAuth).toHaveBeenCalledTimes(1);
    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } });
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    await act(async () => resolve({ data: { url: 'https://accounts.google.com/' }, error: null }));
    expect(button).toBeDisabled();
  });

  it('shows safe errors and unlocks retry when the provider cannot be started', async () => {
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: { message: 'private-secret' } });
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: '使用 Google 登入' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('無法啟動 Google 登入');
    expect(screen.getByRole('alert')).not.toHaveTextContent('private-secret');
    expect(screen.getByRole('button', { name: '使用 Google 登入' })).toBeEnabled();
  });

  it('unlocks login when Browser Back restores the page from the back/forward cache', async () => {
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: 'https://accounts.google.com/' }, error: null });
    render(<LoginPage />);
    const button = screen.getByRole('button', { name: '使用 Google 登入' });
    await act(async () => fireEvent.click(button));
    expect(button).toBeDisabled();
    act(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    expect(screen.getByRole('button', { name: '使用 Google 登入' })).toBeEnabled();
  });

  it('preserves Email login and specifies an entry URL for signup confirmation', async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('電子郵件'), { target: { value: 'family@example.com' } });
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'valid-password' } });
    const form = screen.getByLabelText('電子郵件').closest('form')!;
    fireEvent.submit(form);
    await waitFor(() => expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: 'family@example.com', password: 'valid-password' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '還沒有帳號？前往註冊' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: '還沒有帳號？前往註冊' }));
    fireEvent.submit(form);
    await screen.findByText('註冊成功，請至信箱完成驗證後再登入。');
    expect(mocks.signUp).toHaveBeenCalledWith({ email: 'family@example.com', password: 'valid-password', options: { emailRedirectTo: `${window.location.origin}/` } });
  });
});
