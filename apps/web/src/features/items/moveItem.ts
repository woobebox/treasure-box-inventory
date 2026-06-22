import { db } from '../../db/database';
import { getItemById } from '../../db/itemRepository';
import { getLocationById } from '../../db/locationRepository';
import { writeLocalChange } from '../../db/transactions';
import type { HistoryEntry, Item, SyncOp } from '../../domain/types';
import { nowIso } from '../../domain/utils';
import { buildSyncOp } from '../../sync/syncOpFactory';
import { buildHistoryEntry, HISTORY_ACTIONS } from '../../db/historyRepository';

export interface MoveItemInput { householdId: string; itemId: string; toLocationId: string; actorId: string; deviceId: string; }
export interface MoveItemResult { item: Item; historyEntry: HistoryEntry; syncOp: SyncOp; }

export async function moveItem(input: MoveItemInput): Promise<MoveItemResult> {
  const item = await getItemById(input.householdId, input.itemId);
  if (!item) throw new Error('Item not found');
  const destination = await getLocationById(input.householdId, input.toLocationId);
  if (!destination) throw new Error('Destination location not found');
  const timestamp = nowIso();
  const previousLocationId = item.currentLocationId;
  const updated: Item = { ...item, currentLocationId: input.toLocationId, updatedBy: input.actorId, updatedAt: timestamp, version: (item.version ?? 0) + 1 };
  const historyEntry = buildHistoryEntry({ householdId: input.householdId, itemId: item.id, actorId: input.actorId, action: HISTORY_ACTIONS.ITEM_MOVED, fromLocationId: previousLocationId, toLocationId: input.toLocationId, changedFields: { currentLocationId: { from: previousLocationId, to: input.toLocationId } }, deviceId: input.deviceId, occurredAt: timestamp });
  const syncOp = buildSyncOp({ householdId: input.householdId, actorId: input.actorId, deviceId: input.deviceId, opType: 'update', entityType: 'item', entityId: item.id, baseVersion: item.version ?? null, payload: { item: updated, historyEntry } });
  await writeLocalChange([db.items, db.history, db.syncOps], async () => { await db.items.put(updated); await db.history.put(historyEntry); await db.syncOps.put(syncOp); });
  return { item: updated, historyEntry, syncOp };
}
