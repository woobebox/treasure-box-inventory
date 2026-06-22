import { db } from './database';
import type { Item } from '../domain/types';
import { normalizeText, nowIso } from '../domain/utils';

export interface ItemDraft {
  id: string;
  householdId: string;
  createdBy: string;
  updatedBy: string;
  currentLocationId: string;
  name: string;
  category: string;
  notes?: string;
  dueAt?: string | null;
  coverPhotoId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function validateItemDraft(draft: ItemDraft): void {
  if (!draft.householdId.trim()) throw new Error('household_id is required');
  if (!draft.createdBy.trim()) throw new Error('createdBy is required');
  if (!draft.updatedBy.trim()) throw new Error('updatedBy is required');
  if (!draft.currentLocationId.trim()) throw new Error('currentLocationId is required');
  if (!draft.name.trim()) throw new Error('Item name is required');
  if (draft.name.trim().length > 120) throw new Error('Item name must be 120 characters or less');
  if (!draft.category.trim()) throw new Error('Category is required');
  if (draft.dueAt && Number.isNaN(Date.parse(draft.dueAt))) throw new Error('dueAt must be a valid ISO date');
}

export function buildItem(draft: ItemDraft): Item {
  validateItemDraft(draft);
  const timestamp = draft.createdAt ?? nowIso();
  return {
    id: draft.id,
    householdId: draft.householdId,
    createdBy: draft.createdBy,
    updatedBy: draft.updatedBy,
    currentLocationId: draft.currentLocationId,
    coverPhotoId: draft.coverPhotoId ?? null,
    name: draft.name.trim(),
    normalizedName: normalizeText(draft.name),
    category: draft.category.trim(),
    status: 'active',
    notes: draft.notes?.trim() || undefined,
    dueAt: draft.dueAt ?? null,
    createdAt: timestamp,
    updatedAt: draft.updatedAt ?? timestamp,
    deletedAt: null,
    version: 1
  };
}

export async function putItem(item: Item): Promise<string> {
  if (!item.householdId) throw new Error('household_id is required');
  return db.items.put(item);
}

export async function getItemById(householdId: string, itemId: string): Promise<Item | undefined> {
  if (!householdId) throw new Error('household_id is required');
  const item = await db.items.get(itemId);
  return item?.householdId === householdId ? item : undefined;
}

export async function listItemsByHousehold(householdId: string): Promise<Item[]> {
  if (!householdId) throw new Error('household_id is required');
  return db.items.where('householdId').equals(householdId).filter((item) => !item.deletedAt).toArray();
}

export async function updateItem(item: Item, patch: Partial<Omit<Item, 'id' | 'householdId' | 'createdAt'>>): Promise<Item> {
  const updated: Item = { ...item, ...patch, updatedAt: nowIso(), version: (item.version ?? 0) + 1 };
  if (patch.name) updated.normalizedName = normalizeText(patch.name);
  await putItem(updated);
  return updated;
}
