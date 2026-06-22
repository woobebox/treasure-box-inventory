import { db } from './database';
import type { ItemTag, Tag } from '../domain/types';
import { createId, normalizeText, nowIso } from '../domain/utils';

export function validateTagName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Tag name is required');
  if (trimmed.length > 40) throw new Error('Tag name must be 40 characters or less');
  return trimmed;
}

export async function findOrCreateTag(householdId: string, name: string): Promise<Tag> {
  if (!householdId.trim()) throw new Error('household_id is required');
  const trimmed = validateTagName(name);
  const normalizedName = normalizeText(trimmed);
  const existing = await db.tags.where('householdId').equals(householdId).filter((tag) => tag.normalizedName === normalizedName && !tag.deletedAt).first();
  if (existing) return existing;
  const timestamp = nowIso();
  const tag: Tag = { id: createId(), householdId, name: trimmed, normalizedName, createdAt: timestamp, updatedAt: timestamp, deletedAt: null, version: 1 };
  await db.tags.put(tag);
  return tag;
}

export async function listTagsByHousehold(householdId: string): Promise<Tag[]> {
  if (!householdId.trim()) throw new Error('household_id is required');
  return db.tags.where('householdId').equals(householdId).filter((tag) => !tag.deletedAt).sortBy('normalizedName');
}

export async function replaceItemTags(householdId: string, itemId: string, tagIds: string[]): Promise<ItemTag[]> {
  if (!householdId.trim()) throw new Error('household_id is required');
  await db.itemTags.where('itemId').equals(itemId).delete();
  const createdAt = nowIso();
  const rows = [...new Set(tagIds)].map((tagId) => ({ householdId, itemId, tagId, createdAt }));
  await db.itemTags.bulkPut(rows);
  return rows;
}
