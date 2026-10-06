import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Household, HouseholdMember } from '../domain/types';
import { db } from '../db/database';

const mocks = vi.hoisted(() => ({ user: { id: 'user-a' } as { id: string } | null, listMyHouseholds: vi.fn(), listMyMemberships: vi.fn(), createHouseholdCloud: vi.fn() }));
vi.mock('../services/supabaseClient', () => ({ supabase: {} }));
vi.mock('../services/authContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('../services/cloudHousehold', () => mocks);
import { HouseholdProvider } from '../services/householdContext';
import { useHousehold } from '../services/householdContextValue';

const at = '2026-10-06T00:00:00Z';
const household = (id = 'house-a'): Household => ({ id, name: id, createdBy: 'owner', createdAt: at, updatedAt: at });
const membership = (role: 'admin' | 'member' = 'member', userId = 'user-a', householdId = 'house-a'): HouseholdMember => ({ id: `member-${userId}`, householdId, userId, role, status: 'active', createdAt: at, updatedAt: at });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function Probe() {
  const state = useHousehold();
  return <><p>{state.userId}:{state.isReady ? 'ready' : 'loading'}:{state.householdId}:{state.currentMember?.role ?? 'none'}</p><p role="alert">{state.error}</p><button onClick={state.retry}>retry</button><button onClick={() => state.selectHousehold('unauthorized')}>select unauthorized</button><button onClick={() => void state.createHousehold('new')}>create</button></>;
}

describe('household session isolation', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    mocks.user = { id: 'user-a' };
    localStorage.clear();
    await db.delete(); await db.open();
    mocks.listMyHouseholds.mockResolvedValue([household()]);
    mocks.listMyMemberships.mockResolvedValue([membership()]);
  });
  afterEach(cleanup);

  it.each(['member', 'admin'] as const)('mirrors authoritative %s role and replaces a stale elevated local row', async (role) => {
    await db.householdMembers.put({ ...membership('admin'), id: 'stale-local' });
    await db.householdMembers.put({ ...membership('admin', 'other'), id: 'other-member' });
    mocks.listMyMemberships.mockResolvedValue([membership(role)]);
    render(<HouseholdProvider><Probe /></HouseholdProvider>);
    await screen.findByText(`user-a:ready:house-a:${role}`);
    expect(await db.householdMembers.get('stale-local')).toBeUndefined();
    expect((await db.householdMembers.get('member-user-a'))?.role).toBe(role);
    expect((await db.householdMembers.get('other-member'))?.role).toBe('admin');
    fireEvent.click(screen.getByText('select unauthorized'));
    expect(screen.getByText(`user-a:ready:house-a:${role}`)).toBeInTheDocument();
  });

  it('does not show a previous household while the next user loads or after signout', async () => {
    const view = render(<HouseholdProvider><Probe /></HouseholdProvider>);
    await screen.findByText('user-a:ready:house-a:member');
    const next = deferred<Household[]>();
    mocks.listMyHouseholds.mockReturnValue(next.promise);
    mocks.listMyMemberships.mockResolvedValue([membership('member', 'user-b', 'house-b')]);
    mocks.user = { id: 'user-b' };
    view.rerender(<HouseholdProvider><Probe /></HouseholdProvider>);
    expect(screen.getByText('user-b:loading::none')).toBeInTheDocument();
    expect(screen.queryByText('user-a:ready:house-a:member')).not.toBeInTheDocument();
    await act(async () => next.resolve([household('house-b')]));
    await screen.findByText('user-b:ready:house-b:member');
    mocks.user = null;
    view.rerender(<HouseholdProvider><Probe /></HouseholdProvider>);
    expect(screen.getByText('local-demo-user:loading::none')).toBeInTheDocument();
  });

  it('ignores an old account request that completes after switching accounts', async () => {
    const old = deferred<Household[]>();
    mocks.listMyHouseholds.mockReturnValueOnce(old.promise);
    const view = render(<HouseholdProvider><Probe /></HouseholdProvider>);
    mocks.user = { id: 'user-b' };
    mocks.listMyHouseholds.mockResolvedValue([household('house-b')]);
    mocks.listMyMemberships.mockResolvedValue([membership('member', 'user-b', 'house-b')]);
    view.rerender(<HouseholdProvider><Probe /></HouseholdProvider>);
    await screen.findByText('user-b:ready:house-b:member');
    await act(async () => old.resolve([household()]));
    expect(screen.getByText('user-b:ready:house-b:member')).toBeInTheDocument();
    expect(await db.householdMembers.get('member-user-a')).toBeUndefined();
  });

  it('excludes households without an active membership and clears stale local membership', async () => {
    await db.householdMembers.put(membership('admin'));
    mocks.listMyMemberships.mockResolvedValue([]);
    render(<HouseholdProvider><Probe /></HouseholdProvider>);
    await screen.findByText('user-a:ready::none');
    expect(await db.householdMembers.get('member-user-a')).toBeUndefined();
  });

  it('surfaces cloud failures without exposing details and can retry', async () => {
    mocks.listMyHouseholds.mockRejectedValueOnce(new Error('private-backend-error'));
    render(<HouseholdProvider><Probe /></HouseholdProvider>);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('無法載入家庭資料'));
    expect(screen.getByRole('alert')).not.toHaveTextContent('private-backend-error');
    expect(screen.getByText('user-a:loading::none')).toBeInTheDocument();
    fireEvent.click(screen.getByText('retry'));
    await screen.findByText('user-a:ready:house-a:member');
  });

  it('gets the new household role from the cloud rather than granting admin locally', async () => {
    render(<HouseholdProvider><Probe /></HouseholdProvider>);
    await screen.findByText('user-a:ready:house-a:member');
    mocks.createHouseholdCloud.mockResolvedValue(household('new-house'));
    mocks.listMyMemberships.mockResolvedValue([membership('member', 'user-a', 'new-house')]);
    fireEvent.click(screen.getByText('create'));
    await screen.findByText('user-a:ready:new-house:member');
    expect((await db.householdMembers.get('member-user-a'))?.role).toBe('member');
  });
});
