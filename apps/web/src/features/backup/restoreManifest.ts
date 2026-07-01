import { db } from '../../db/database';
import type { BackupManifest } from './exportManifest';
import { restoreDryRun } from './restoreDryRun';

export interface RestoreResult {
  locations: number;
  items: number;
  photos: number;
  tags: number;
  history: number;
}

// Restore is intentionally merge-based: records with the same id are replaced,
// while unrelated current records are preserved. This avoids destructive
// deletion and makes importing the same backup idempotent.
export async function restoreManifest(householdId: string, value: unknown): Promise<RestoreResult> {
  const dryRun = restoreDryRun(value);
  if (!dryRun.valid) throw new Error(dryRun.errors.join(' '));

  const manifest = value as BackupManifest;
  if (manifest.household && manifest.household.id !== householdId) throw new Error('此備份屬於另一個家庭，已拒絕匯入。');

  const scopedRows = [
    ...manifest.locations,
    ...manifest.items,
    ...manifest.photos,
    ...manifest.tags,
    ...manifest.itemTags,
    ...(manifest.history ?? []),
  ];
  if (scopedRows.some((row) => row.householdId !== householdId)) throw new Error('備份包含其他家庭的資料，已拒絕匯入。');

  await db.transaction('rw', [db.locations, db.items, db.photos, db.tags, db.itemTags, db.history], async () => {
    if (manifest.locations.length) await db.locations.bulkPut(manifest.locations);
    if (manifest.items.length) await db.items.bulkPut(manifest.items);
    if (manifest.photos.length) await db.photos.bulkPut(manifest.photos);
    if (manifest.tags.length) await db.tags.bulkPut(manifest.tags);
    if (manifest.itemTags.length) await db.itemTags.bulkPut(manifest.itemTags);
    if (manifest.history?.length) await db.history.bulkPut(manifest.history);
  });

  return {
    locations: manifest.locations.length,
    items: manifest.items.length,
    photos: manifest.photos.length,
    tags: manifest.tags.length,
    history: manifest.history?.length ?? 0,
  };
}
