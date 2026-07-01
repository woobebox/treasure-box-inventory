import { describe, expect, it } from 'vitest';
import { isExpiredSoftDelete, isWithinSoftDeleteRetention } from '../domain/retention';
import { exportItemsCsv } from '../features/backup/exportCsv';
import { restoreDryRun } from '../features/backup/restoreDryRun';

describe('backup and soft delete retention', () => {
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
});
