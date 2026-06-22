import { db } from './database';
import type { HistoryEntry } from '../domain/types';
import { createId, nowIso } from '../domain/utils';

export const HISTORY_ACTIONS = {
  ITEM_CREATED: 'item.created',
  ITEM_MOVED: 'item.moved',
  ITEM_UPDATED: 'item.updated'
} as const;

export type HistoryAction = (typeof HISTORY_ACTIONS)[keyof typeof HISTORY_ACTIONS];

export interface HistoryInput {
  householdId: string;
  itemId?: string | null;
  actorId: string;
  action: HistoryAction | string;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  changedFields?: Record<string, unknown>;
  deviceId: string;
  occurredAt?: string;
}

export function buildHistoryEntry(input: HistoryInput): HistoryEntry {
  if (!input.householdId.trim()) throw new Error('household_id is required');
  if (!input.actorId.trim()) throw new Error('actorId is required');
  if (!input.action.trim()) throw new Error('action is required');
  if (!input.deviceId.trim()) throw new Error('deviceId is required');
  return {
    id: createId(),
    householdId: input.householdId,
    itemId: input.itemId ?? null,
    actorId: input.actorId,
    action: input.action,
    fromLocationId: input.fromLocationId ?? null,
    toLocationId: input.toLocationId ?? null,
    changedFields: input.changedFields ?? {},
    deviceId: input.deviceId,
    occurredAt: input.occurredAt ?? nowIso()
  };
}

export async function addHistoryEntry(input: HistoryInput): Promise<HistoryEntry> {
  const entry = buildHistoryEntry(input);
  await db.history.put(entry);
  return entry;
}

export async function listItemHistory(householdId: string, itemId: string): Promise<HistoryEntry[]> {
  if (!householdId.trim()) throw new Error('household_id is required');
  return db.history
    .where('itemId')
    .equals(itemId)
    .filter((entry) => entry.householdId === householdId)
    .reverse()
    .sortBy('occurredAt');
}
