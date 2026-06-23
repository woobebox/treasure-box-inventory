import { db } from './database';
import type { Household, HouseholdMember, Role } from '../domain/types';
import { createId, nowIso } from '../domain/utils';

export async function listHouseholdsForUser(userId: string): Promise<Household[]> { const memberships = await db.householdMembers.where({ userId, status: 'active' }).toArray(); const ids = memberships.map((m) => m.householdId); return db.households.bulkGet(ids).then((rows) => rows.filter(Boolean) as Household[]); }
export async function getActiveMember(householdId: string, userId: string): Promise<HouseholdMember | undefined> { return db.householdMembers.where({ householdId, userId, status: 'active' }).first(); }
export async function listMembers(householdId: string): Promise<HouseholdMember[]> { return db.householdMembers.where({ householdId }).toArray(); }
export async function createHousehold(name: string, userId: string): Promise<Household> { const timestamp = nowIso(); const household = { id: createId(), name, createdBy: userId, createdAt: timestamp, updatedAt: timestamp }; const member: HouseholdMember = { id: createId(), householdId: household.id, userId, role: 'admin', status: 'active', joinedAt: timestamp, createdAt: timestamp, updatedAt: timestamp }; await db.transaction('rw', db.households, db.householdMembers, async () => { await db.households.put(household); await db.householdMembers.put(member); }); return household; }
export async function inviteMember(householdId: string, userId: string, invitedBy: string, role: Role = 'member'): Promise<HouseholdMember> { const timestamp = nowIso(); const member = { id: createId(), householdId, userId, role, status: 'invited' as const, invitedBy, invitedAt: timestamp, createdAt: timestamp, updatedAt: timestamp }; await db.householdMembers.put(member); return member; }
export async function removeMember(memberId: string): Promise<void> { await db.householdMembers.update(memberId, { status: 'removed', removedAt: nowIso(), updatedAt: nowIso() }); }
