import type { BackupManifest } from './exportManifest';

export interface RestoreDryRunResult { valid: boolean; errors: string[]; counts: Record<string, number>; }

export function restoreDryRun(value: unknown): RestoreDryRunResult {
  const errors: string[] = [];
  const manifest = value as Partial<BackupManifest>;
  if (!manifest || typeof manifest !== 'object') errors.push('備份 manifest 必須是物件。');
  if (manifest.schemaVersion !== 1) errors.push('不支援的備份 schema version。');
  for (const key of ['locations', 'items', 'photos', 'tags', 'itemTags'] as const) if (!Array.isArray(manifest[key])) errors.push(`${key} 必須是陣列。`);
  if (Array.isArray(manifest.photos)) for (const photo of manifest.photos) if (photo.originalRetained !== false || photo.exifStripped !== true) errors.push(`照片 ${photo.id} 違反保留政策。`);
  return { valid: errors.length === 0, errors, counts: { locations: manifest.locations?.length ?? 0, items: manifest.items?.length ?? 0, photos: manifest.photos?.length ?? 0, tags: manifest.tags?.length ?? 0 } };
}
