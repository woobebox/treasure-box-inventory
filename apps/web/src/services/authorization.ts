import type { HouseholdMember, Role } from '../domain/types';

export function getCurrentHouseholdId(explicitHouseholdId?: string | null): string {
  if (!explicitHouseholdId) throw new Error('編輯庫存前必須先選擇家庭。');
  return explicitHouseholdId;
}

export function requireRole(member: HouseholdMember | undefined, allowedRoles: Role[]): HouseholdMember {
  if (!member || member.status !== 'active' || !allowedRoles.includes(member.role)) {
    throw new Error('你沒有執行此家庭操作的權限。');
  }
  return member;
}

export function canDeleteOrRestore(member: HouseholdMember | undefined): boolean {
  return member?.status === 'active' && member.role === 'admin';
}
