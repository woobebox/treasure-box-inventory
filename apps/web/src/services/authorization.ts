import type { HouseholdMember, Role } from '../domain/types';

export function getCurrentHouseholdId(explicitHouseholdId?: string | null): string {
  if (!explicitHouseholdId) throw new Error('A household must be selected before editing inventory.');
  return explicitHouseholdId;
}

export function requireRole(member: HouseholdMember | undefined, allowedRoles: Role[]): HouseholdMember {
  if (!member || member.status !== 'active' || !allowedRoles.includes(member.role)) {
    throw new Error('You do not have permission to perform this household action.');
  }
  return member;
}

export function canDeleteOrRestore(member: HouseholdMember | undefined): boolean {
  return member?.status === 'active' && member.role === 'admin';
}
