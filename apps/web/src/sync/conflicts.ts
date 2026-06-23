import { db } from '../db/database';
import type { ConflictRecord } from '../domain/types';
import { createId, nowIso } from '../domain/utils';

export async function recordConflict(input: Omit<ConflictRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConflictRecord> {
  const timestamp = nowIso(); const conflict = { id: createId(), createdAt: timestamp, updatedAt: timestamp, ...input };
  await db.conflicts.put(conflict); return conflict;
}
export function listOpenConflicts(householdId: string) { return db.conflicts.where({ householdId, resolvedAt: null }).toArray(); }
export async function resolveConflict(conflictId: string) { await db.conflicts.update(conflictId, { resolvedAt: nowIso(), updatedAt: nowIso() }); }
