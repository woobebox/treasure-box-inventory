import { describe, expect, it } from 'vitest';
import { buildRetainedPhotoPayload, assertNoOriginalRetained } from '../media/photoRetentionPolicy';

const image = { blob: new Blob(['x'], { type: 'image/jpeg' }), width: 100, height: 80, mimeType: 'image/jpeg' as const, byteSize: 1, objectUrl: 'blob:main' };
const thumb = { ...image, width: 40, height: 32, objectUrl: 'blob:thumb' };

describe('photo retention policy', () => {
  it('persists only re-encoded main and thumbnail metadata', () => {
    const payload = buildRetainedPhotoPayload(image, thumb, 'local/photo-1');
    expect(payload.metadata.originalRetained).toBe(false);
    expect(payload.metadata.exifStripped).toBe(true);
    expect(payload.metadata.storageKey).toBe('local/photo-1/main.jpg');
    expect(payload.metadata.thumbKey).toBe('local/photo-1/thumb.jpg');
  });

  it('rejects retained originals', () => {
    expect(() => assertNoOriginalRetained({ originalRetained: true, exifStripped: true })).toThrow(/原始照片/);
  });
});
