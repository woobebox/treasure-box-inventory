import { db } from '../../db/database';
import type { Household, Item, Location, Photo, Tag } from '../../domain/types';

export interface BackupManifest { schemaVersion: 1; exportedAt: string; household: Household | null; locations: Location[]; items: Item[]; photos: Photo[]; tags: Tag[]; itemTags: unknown[]; }

export async function exportManifest(householdId: string): Promise<BackupManifest> {
  const [household, locations, items, photos, tags, itemTags] = await Promise.all([
    db.households.get(householdId),
    db.locations.where('householdId').equals(householdId).toArray(),
    db.items.where('householdId').equals(householdId).toArray(),
    db.photos.where('householdId').equals(householdId).toArray(),
    db.tags.where('householdId').equals(householdId).toArray(),
    db.itemTags.where('householdId').equals(householdId).toArray()
  ]);
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), household: household ?? null, locations, items, photos: photos.map((photo) => ({ ...photo, originalRetained: false, exifStripped: true })), tags, itemTags };
}
