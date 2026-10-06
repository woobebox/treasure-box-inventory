import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn() }));
vi.mock('../services/supabaseClient', () => ({ supabase: mocks }));
import { listMyMemberships } from '../services/cloudHousehold';

describe('cloud membership authorization', () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.from.mockReturnValue(mocks); mocks.select.mockReturnValue(mocks); mocks.eq.mockReturnValueOnce(mocks); });
  it('filters by current user and active status, rejects unknown roles or other users', async () => {
    const row = { id: 'member', household_id: 'house', user_id: 'user', role: 'member', status: 'active', created_at: 'at', updated_at: 'at' };
    mocks.eq.mockResolvedValueOnce({ data: [row, { ...row, id: 'removed', status: 'removed' }, { ...row, id: 'other', user_id: 'other' }, { ...row, id: 'unknown', role: 'superadmin' }], error: null });
    const result = await listMyMemberships('user');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'member', householdId: 'house', userId: 'user', role: 'member', status: 'active' });
    expect(mocks.from).toHaveBeenCalledWith('household_members');
    expect(mocks.eq.mock.calls).toEqual([['user_id', 'user'], ['status', 'active']]);
  });
  it('does not turn a failed query into an empty successful result', async () => {
    mocks.eq.mockResolvedValueOnce({ data: null, error: { message: 'denied' } });
    await expect(listMyMemberships('user')).rejects.toThrow('denied');
  });
});
