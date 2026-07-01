import { db } from '../db/database';
import type { SyncOp } from '../domain/types';
import { nowIso } from '../domain/utils';
import { supabase } from '../services/supabaseClient';

export interface PushResult { synced: number; conflicted: number; failed: number; cursor?: string; reasons?: string[]; }
// Manual sync re-attempts every op that has not been confirmed synced yet
// (pending, plus previously failed/conflicted/interrupted ones), so a transient
// rejection — e.g. an item pushed before its location — can recover on retry.
export async function getPendingOutbox(householdId: string): Promise<SyncOp[]> {
  return db.syncOps.where('householdId').equals(householdId).filter((op) => op.status !== 'synced').sortBy('createdAt');
}
export function retryDelayMs(retryCount: number): number { return Math.min(30_000, 1000 * 2 ** retryCount); }

// Server rejections that represent genuine conflicts needing resolution, versus
// transient/ordering errors that are worth retrying on the next sync.
const TRUE_CONFLICTS = new Set(['version_conflict', 'household_mismatch', 'admin_required']);

export async function pushOutbox(householdId: string, deviceId: string): Promise<PushResult> {
  const ops = await getPendingOutbox(householdId); if (!ops.length) return { synced: 0, conflicted: 0, failed: 0 };
  await db.syncOps.bulkUpdate(ops.map((op) => ({ key: op.id, changes: { status: 'pushing' as const, updatedAt: nowIso() } })));
  if (!supabase) { await markFailed(ops, '尚未設定 Supabase。'); return { synced: 0, conflicted: 0, failed: ops.length }; }
  const { data, error } = await supabase.functions.invoke('sync/push', { body: { household_id: householdId, device_id: deviceId, ops: ops.map((op) => ({ id: op.id, op_type: op.opType, entity_type: op.entityType, entity_id: op.entityId, base_version: op.baseVersion ?? null, payload: op.payload, created_at: op.createdAt })) } });
  if (error) { await markFailed(ops, error.message); return { synced: 0, conflicted: 0, failed: ops.length }; }
  const timestamp = nowIso();
  const ackIds = new Set((data?.acks ?? []).map((ack: { op_id: string }) => ack.op_id));
  const rejections = new Map<string, string>((data?.conflicts ?? []).map((conflict: { op_id: string; reason?: string }) => [conflict.op_id, conflict.reason ?? '伺服器衝突']));
  let conflicted = 0; let failed = 0;
  await db.transaction('rw', [db.syncOps, db.deviceSync], async () => {
    for (const op of ops) {
      if (ackIds.has(op.id)) { await db.syncOps.update(op.id, { status: 'synced', syncedAt: timestamp, lastError: null, updatedAt: timestamp }); continue; }
      const reason = rejections.get(op.id);
      if (reason && TRUE_CONFLICTS.has(reason)) { conflicted += 1; await db.syncOps.update(op.id, { status: 'conflicted', lastError: reason, updatedAt: timestamp }); }
      else if (reason) { failed += 1; await db.syncOps.update(op.id, { status: 'failed', retryCount: op.retryCount + 1, lastError: reason, updatedAt: timestamp }); }
      else { await db.syncOps.update(op.id, { status: 'pending', updatedAt: timestamp }); }
    }
    if (data?.cursor) await db.deviceSync.put({ householdId, deviceId, pullCursor: data.cursor, lastPulledAt: timestamp });
  });
  return { synced: ackIds.size, conflicted, failed, cursor: data?.cursor, reasons: [...new Set(rejections.values())] };
}
async function markFailed(ops: SyncOp[], message: string) { const timestamp = nowIso(); await db.syncOps.bulkUpdate(ops.map((op) => ({ key: op.id, changes: { status: 'failed' as const, retryCount: op.retryCount + 1, lastError: message, updatedAt: timestamp } }))); }
