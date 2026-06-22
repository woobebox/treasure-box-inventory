import type { SyncOp } from '../domain/types';
import { createId, nowIso } from '../domain/utils';

interface SyncOpInput { householdId: string; actorId: string; deviceId: string; opType: string; entityType: string; entityId: string; baseVersion?: number | null; payload: Record<string, unknown>; }

export function buildSyncOp(input: SyncOpInput): SyncOp {
  const timestamp = nowIso();
  return { id: createId(), status: 'pending', retryCount: 0, createdAt: timestamp, updatedAt: timestamp, ...input };
}
