import type { BackupManifest } from './exportManifest';

export interface RestoreDryRunResult { valid: boolean; errors: string[]; counts: Record<string, number>; }

export function restoreDryRun(value: unknown): RestoreDryRunResult {
  const errors: string[] = [];
  const manifest = value as Partial<BackupManifest>;
  if (!manifest || typeof manifest !== 'object') errors.push('Manifest must be an object.');
  if (manifest.schemaVersion !== 1) errors.push('Unsupported schema version.');
  for (const key of ['locations', 'items', 'photos', 'tags', 'itemTags'] as const) if (!Array.isArray(manifest[key])) errors.push(`${key} must be an array.`);
  if (Array.isArray(manifest.photos)) for (const photo of manifest.photos) if (photo.originalRetained !== false || photo.exifStripped !== true) errors.push(`Photo ${photo.id} violates retention policy.`);
  return { valid: errors.length === 0, errors, counts: { locations: manifest.locations?.length ?? 0, items: manifest.items?.length ?? 0, photos: manifest.photos?.length ?? 0, tags: manifest.tags?.length ?? 0 } };
}
