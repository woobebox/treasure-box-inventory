import type { ItemFormState } from './useItemForm';

export type StoredItemDraft = Pick<ItemFormState, 'name' | 'category' | 'locationId' | 'notes' | 'tagNames'>;

function key(householdId: string, userId: string): string {
  return `treasure-box:item-draft:${householdId}:${userId}`;
}

export function readItemDraft(householdId: string, userId: string): StoredItemDraft | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key(householdId, userId)) ?? 'null') as Partial<StoredItemDraft> | null;
    if (!value || typeof value.name !== 'string' || typeof value.category !== 'string' || typeof value.locationId !== 'string' || typeof value.notes !== 'string' || !Array.isArray(value.tagNames)) return null;
    return { name: value.name, category: value.category, locationId: value.locationId, notes: value.notes, tagNames: value.tagNames.filter((tag): tag is string => typeof tag === 'string') };
  } catch {
    return null;
  }
}

export function writeItemDraft(householdId: string, userId: string, state: ItemFormState): void {
  const draft: StoredItemDraft = { name: state.name, category: state.category, locationId: state.locationId, notes: state.notes, tagNames: state.tagNames };
  try { sessionStorage.setItem(key(householdId, userId), JSON.stringify(draft)); } catch { /* Storage may be unavailable in private browsing. */ }
}

export function clearItemDraft(householdId: string, userId: string): void {
  try { sessionStorage.removeItem(key(householdId, userId)); } catch { /* Storage may be unavailable. */ }
}
