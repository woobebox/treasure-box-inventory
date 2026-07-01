import { db } from './database';
import type { Location } from '../domain/types';
import { createId, nowIso } from '../domain/utils';
import { buildSyncOp } from '../sync/syncOpFactory';

export interface LocationDraft { householdId: string; parentId?: string | null; type: Location['type']; name: string; sortOrder?: number; actorId?: string; deviceId?: string; }
export interface UpdateLocationInput { id: string; householdId: string; parentId?: string | null; type?: Location['type']; name?: string; sortOrder?: number; actorId?: string; deviceId?: string; }

function assertHousehold(householdId: string): void { if (!householdId.trim()) throw new Error('缺少家庭識別碼'); }
function validateName(name: string): string { const trimmed = name.trim(); if (!trimmed) throw new Error('請輸入位置名稱'); if (trimmed.length > 80) throw new Error('位置名稱最多 80 字'); return trimmed; }

export async function listLocationsByHousehold(householdId: string): Promise<Location[]> {
  assertHousehold(householdId);
  return db.locations.where('householdId').equals(householdId).filter((location) => !location.deletedAt).sortBy('sortOrder');
}

export async function getLocationById(householdId: string, locationId: string): Promise<Location | undefined> {
  assertHousehold(householdId);
  const location = await db.locations.get(locationId);
  return location?.householdId === householdId && !location.deletedAt ? location : undefined;
}

export async function getLocationAncestors(householdId: string, locationId: string): Promise<Location[]> {
  const ancestors: Location[] = [];
  const seen = new Set<string>();
  let current = await getLocationById(householdId, locationId);
  while (current?.parentId) {
    if (seen.has(current.parentId)) throw new Error('偵測到位置階層循環');
    seen.add(current.parentId);
    const parent = await getLocationById(householdId, current.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }
  return ancestors;
}

export async function wouldCreateLocationCycle(householdId: string, locationId: string, nextParentId?: string | null): Promise<boolean> {
  assertHousehold(householdId);
  if (!nextParentId) return false;
  if (nextParentId === locationId) return true;
  let parent = await getLocationById(householdId, nextParentId);
  const seen = new Set<string>([locationId]);
  while (parent) {
    if (seen.has(parent.id)) return true;
    seen.add(parent.id);
    parent = parent.parentId ? await getLocationById(householdId, parent.parentId) : undefined;
  }
  return false;
}

async function buildLocationPath(householdId: string, name: string, parentId?: string | null): Promise<string> {
  if (!parentId) return name;
  const parent = await getLocationById(householdId, parentId);
  if (!parent) throw new Error('在目前家庭中找不到上層位置');
  return `${parent.path} / ${name}`;
}

export async function createLocation(draft: LocationDraft): Promise<Location> {
  assertHousehold(draft.householdId);
  const name = validateName(draft.name);
  const timestamp = nowIso();
  const location: Location = { id: createId(), householdId: draft.householdId, parentId: draft.parentId ?? null, type: draft.type, name, path: await buildLocationPath(draft.householdId, name, draft.parentId), sortOrder: draft.sortOrder ?? 0, createdAt: timestamp, updatedAt: timestamp, deletedAt: null, version: 1 };
  if (draft.actorId && draft.deviceId) {
    const syncOp = buildSyncOp({ householdId: draft.householdId, actorId: draft.actorId, deviceId: draft.deviceId, opType: 'location.create', entityType: 'locations', entityId: location.id, baseVersion: null, payload: { location } });
    await db.transaction('rw', [db.locations, db.syncOps], async () => { await db.locations.put(location); await db.syncOps.put(syncOp); });
  } else {
    await db.locations.put(location);
  }
  return location;
}

export async function updateLocation(input: UpdateLocationInput): Promise<Location> {
  assertHousehold(input.householdId);
  const current = await getLocationById(input.householdId, input.id);
  if (!current) throw new Error('找不到位置');
  const parentId = input.parentId === undefined ? current.parentId : input.parentId;
  if (await wouldCreateLocationCycle(input.householdId, current.id, parentId)) throw new Error('此上層位置會造成階層循環');
  const name = input.name === undefined ? current.name : validateName(input.name);
  const updated: Location = { ...current, parentId: parentId ?? null, type: input.type ?? current.type, name, path: await buildLocationPath(input.householdId, name, parentId), sortOrder: input.sortOrder ?? current.sortOrder, updatedAt: nowIso(), version: (current.version ?? 0) + 1 };
  if (input.actorId && input.deviceId) {
    const syncOp = buildSyncOp({ householdId: input.householdId, actorId: input.actorId, deviceId: input.deviceId, opType: 'location.update', entityType: 'locations', entityId: updated.id, baseVersion: current.version ?? null, payload: { location: updated } });
    await db.transaction('rw', [db.locations, db.syncOps], async () => { await db.locations.put(updated); await db.syncOps.put(syncOp); });
  } else {
    await db.locations.put(updated);
  }
  return updated;
}
