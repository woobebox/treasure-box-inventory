import { db } from './database';
import type { Location } from '../domain/types';
import { createId, nowIso } from '../domain/utils';

export interface LocationDraft { householdId: string; parentId?: string | null; type: Location['type']; name: string; sortOrder?: number; }
export interface UpdateLocationInput { id: string; householdId: string; parentId?: string | null; type?: Location['type']; name?: string; sortOrder?: number; }

function assertHousehold(householdId: string): void { if (!householdId.trim()) throw new Error('household_id is required'); }
function validateName(name: string): string { const trimmed = name.trim(); if (!trimmed) throw new Error('Location name is required'); if (trimmed.length > 80) throw new Error('Location name must be 80 characters or less'); return trimmed; }

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
    if (seen.has(current.parentId)) throw new Error('Location cycle detected');
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
  if (!parent) throw new Error('Parent location not found in household');
  return `${parent.path} / ${name}`;
}

export async function createLocation(draft: LocationDraft): Promise<Location> {
  assertHousehold(draft.householdId);
  const name = validateName(draft.name);
  const timestamp = nowIso();
  const location: Location = { id: createId(), householdId: draft.householdId, parentId: draft.parentId ?? null, type: draft.type, name, path: await buildLocationPath(draft.householdId, name, draft.parentId), sortOrder: draft.sortOrder ?? 0, createdAt: timestamp, updatedAt: timestamp, deletedAt: null, version: 1 };
  await db.locations.put(location);
  return location;
}

export async function updateLocation(input: UpdateLocationInput): Promise<Location> {
  assertHousehold(input.householdId);
  const current = await getLocationById(input.householdId, input.id);
  if (!current) throw new Error('Location not found');
  const parentId = input.parentId === undefined ? current.parentId : input.parentId;
  if (await wouldCreateLocationCycle(input.householdId, current.id, parentId)) throw new Error('Location parent would create a cycle');
  const name = input.name === undefined ? current.name : validateName(input.name);
  const updated: Location = { ...current, parentId: parentId ?? null, type: input.type ?? current.type, name, path: await buildLocationPath(input.householdId, name, parentId), sortOrder: input.sortOrder ?? current.sortOrder, updatedAt: nowIso(), version: (current.version ?? 0) + 1 };
  await db.locations.put(updated);
  return updated;
}
