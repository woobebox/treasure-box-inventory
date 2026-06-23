import { db } from '../db/database';
import { nowIso } from '../domain/utils';
import { supabase } from '../services/supabaseClient';
import { recordConflict } from './conflicts';

type RemoteChange = { entity_type: string; entity_id: string; version: number; deleted_at?: string | null; payload: Record<string, unknown> };
const tableMap = { items: db.items, locations: db.locations, photos: db.photos, tags: db.tags, history: db.history } as const;
export async function pullChanges(householdId: string, deviceId: string): Promise<{ applied: number; cursor?: string }> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const sync = await db.deviceSync.get([householdId, deviceId]);
  const { data, error } = await supabase.functions.invoke(`sync/changes?household_id=${encodeURIComponent(householdId)}&device_id=${encodeURIComponent(deviceId)}&cursor=${encodeURIComponent(sync?.pullCursor ?? '')}`, { method: 'GET' });
  if (error) throw new Error(error.message);
  let applied = 0;
  await db.transaction('rw', db.items, db.locations, db.photos, db.tags, db.history, db.deviceSync, db.conflicts, async () => {
    for (const change of (data?.changes ?? []) as RemoteChange[]) {
      const table = tableMap[change.entity_type as keyof typeof tableMap]; if (!table) continue;
      const local = await table.get(change.entity_id) as { version?: number } | undefined;
      if (local?.version && local.version > change.version) { await recordConflict({ householdId, syncOpId: change.entity_id, entityType: change.entity_type, entityId: change.entity_id, localPayload: local as Record<string, unknown>, remotePayload: change.payload }); continue; }
      await table.put(change.payload as never); applied += 1;
    }
    if (data?.cursor) await db.deviceSync.put({ householdId, deviceId, pullCursor: data.cursor, lastPulledAt: nowIso() });
  });
  return { applied, cursor: data?.cursor };
}
