import { describe, expect, it } from 'vitest';
import { canDeleteOrRestore, requireRole } from '../services/authorization';
import type { HouseholdMember } from '../domain/types';

const base: HouseholdMember = { id: 'm1', householdId: 'h1', userId: 'u1', role: 'member', status: 'active', createdAt: 'now', updatedAt: 'now' };
describe('household authorization', () => {
  it('limits destructive actions to admins', () => {
    expect(canDeleteOrRestore(base)).toBe(false);
    expect(canDeleteOrRestore({ ...base, role: 'admin' })).toBe(true);
  });
  it('rejects inactive or insufficient roles', () => {
    expect(() => requireRole(base, ['admin'])).toThrow(/權限/);
    expect(requireRole({ ...base, role: 'admin' }, ['admin']).role).toBe('admin');
  });
});
