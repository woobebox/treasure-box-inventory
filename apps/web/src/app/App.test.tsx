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
    expect(screen.getByText('收納寶盒')).toBeInTheDocument();
    expect(screen.getByText('位置')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
  });
});
