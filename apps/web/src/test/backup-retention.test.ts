import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { isExpiredSoftDelete, isWithinSoftDeleteRetention } from '../domain/retention';
import { backupFilename } from '../features/backup/downloadFile';
import { exportItemsCsv } from '../features/backup/exportCsv';
import { restoreDryRun } from '../features/backup/restoreDryRun';
import { restoreManifest } from '../features/backup/restoreManifest';

describe('backup and soft delete retention', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('enforces the 30-day soft delete window', () => {
    expect(isWithinSoftDeleteRetention('2026-06-01T00:00:00.000Z', new Date('2026-06-30T00:00:00.000Z'))).toBe(true);
    expect(isExpiredSoftDelete('2026-06-01T00:00:00.000Z', new Date('2026-07-02T00:00:00.000Z'))).toBe(true);
  });

  it('validates backup manifests and retention metadata', () => {
    const result = restoreDryRun({ schemaVersion: 1, locations: [], items: [], photos: [{ id: 'p1', originalRetained: false, exifStripped: true }], tags: [], itemTags: [] });
    expect(result.valid).toBe(true);
    expect(restoreDryRun({ schemaVersion: 1, locations: [], items: [], photos: [{ id: 'p2', originalRetained: true, exifStripped: true }], tags: [], itemTags: [] }).valid).toBe(false);
  });

  it('exports item CSV safely', () => {
    const csv = exportItemsCsv([{ id: 'i1', name: 'Box, blue', category: 'storage', status: 'active', currentLocationId: 'l1', updatedAt: 'now' } as never]);
    expect(csv).toContain('"Box, blue"');
  });

  it('creates dated backup filenames', () => {
    expect(backupFilename('json', new Date('2026-07-01T00:00:00.000Z'))).toBe('treasure-box-2026-07-01.json');
  });

  it('restores a valid same-household manifest with merge semantics', async () => {
    const at = '2026-07-01T00:00:00.000Z';
    const manifest = {
      schemaVersion: 1 as const,
      exportedAt: at,
      household: null,
      locations: [{ id: 'l1', householdId: 'hh', parentId: null, type: 'room', name: '房間', path: '房間', sortOrder: 0, createdAt: at, updatedAt: at, deletedAt: null, version: 1 }],
      items: [{ id: 'i1', householdId: 'hh', createdBy: 'u1', updatedBy: 'u1', currentLocationId: 'l1', coverPhotoId: null, name: '物品', normalizedName: '物品', category: '其他', status: 'active' as const, createdAt: at, updatedAt: at, deletedAt: null, version: 1 }],
      photos: [], tags: [], itemTags: [], history: [],
    };
    const result = await restoreManifest('hh', manifest);
    expect(result.items).toBe(1);
    expect((await db.items.get('i1'))?.name).toBe('物品');
    await expect(restoreManifest('another-household', manifest)).rejects.toThrow('其他家庭');
  });
});
