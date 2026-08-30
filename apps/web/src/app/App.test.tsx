import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Exercise the pure-offline path (no Supabase configured): the gate falls
// through to the app shell using the demo household.
vi.mock('../services/supabaseClient', () => ({ supabase: null }));

const { App } = await import('./App');
const { AuthProvider } = await import('../services/auth');
const { HouseholdProvider } = await import('../services/householdContext');

describe('App shell', () => {
  it('renders bottom navigation routes', () => {
    render(<AuthProvider><HouseholdProvider><App /></HouseholdProvider></AuthProvider>);
    expect(screen.getByRole('link', { name: '跳至主要內容' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('heading', { name: '收納寶盒' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '位置' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: '設定' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: '首頁' }).every((link) => link.getAttribute('aria-current') === 'page')).toBe(true);
  });
});
