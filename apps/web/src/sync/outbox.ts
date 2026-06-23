import { db } from '../db/database';
import type { SyncOp } from '../domain/types';
import { nowIso } from '../domain/utils';
import { supabase } from '../services/supabaseClient';

export interface PushResult { synced: number; conflicted: number; failed: number; cursor?: string; }
export async function getPendingOutbox(householdId: string): Promise<SyncOp[]> { return db.syncOps.where({ householdId, status: 'pending' }).sortBy('createdAt'); }
export function retryDelayMs(retryCount: number): number { return Math.min(30_000, 1000 * 2 ** retryCount); }

export async function pushOutbox(householdId: string, deviceId: string): Promise<PushResult> {
  const ops = await getPendingOutbox(householdId); if (!ops.length) return { synced: 0, conflicted: 0, failed: 0 };
  await db.syncOps.bulkUpdate(ops.map((op) => ({ key: op.id, changes: { status: 'pushing' as const, updatedAt: nowIso() } })));
  if (!supabase) { await markFailed(ops, 'Supabase is not configured.'); return { synced: 0, conflicted: 0, failed: ops.length }; }
  const { data, error } = await supabase.functions.invoke('sync/push', { body: { household_id: householdId, device_id: deviceId, ops: ops.map((op) => ({ id: op.id, op_type: op.opType, entity_type: op.entityType, entity_id: op.entityId, base_version: op.baseVersion ?? null, payload: op.payload, created_at: op.createdAt })) } });
  if (error) { await markFailed(ops, error.message); return { synced: 0, conflicted: 0, failed: ops.length }; }
  const timestamp = nowIso();
  const ackIds = new Set((data?.acks ?? []).map((ack: { op_id: string }) => ack.op_id));
  const conflictIds = new Set((data?.conflicts ?? []).map((conflict: { op_id: string }) => conflict.op_id));
  await db.transaction('rw', db.syncOps, db.deviceSync, async () => {
    for (const op of ops) await db.syncOps.update(op.id, ackIds.has(op.id) ? { status: 'synced', syncedAt: timestamp, updatedAt: timestamp } : conflictIds.has(op.id) ? { status: 'conflicted', lastError: 'Server conflict', updatedAt: timestamp } : { status: 'pending', updatedAt: timestamp });
    if (data?.cursor) await db.deviceSync.put({ householdId, deviceId, pullCursor: data.cursor, lastPulledAt: timestamp });
  });
  return { synced: ackIds.size, conflicted: conflictIds.size, failed: 0, cursor: data?.cursor };
}
async function markFailed(ops: SyncOp[], message: string) { const timestamp = nowIso(); await db.syncOps.bulkUpdate(ops.map((op) => ({ key: op.id, changes: { status: 'failed' as const, retryCount: op.retryCount + 1, lastError: message, updatedAt: timestamp } }))); }
