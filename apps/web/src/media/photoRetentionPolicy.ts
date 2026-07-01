import type { PhotoDraft } from '../db/photoRepository';
import type { ProcessedImage } from './imageProcessor';

export interface RetainedPhotoPayload { main: ProcessedImage; thumbnail: ProcessedImage; metadata: Omit<PhotoDraft, 'id' | 'householdId' | 'itemId' | 'createdAt' | 'updatedAt'>; }

export function buildRetainedPhotoPayload(main: ProcessedImage, thumbnail: ProcessedImage, keyPrefix: string): RetainedPhotoPayload {
  if (main.mimeType !== 'image/jpeg' || thumbnail.mimeType !== 'image/jpeg') throw new Error('照片必須重新編碼為 JPEG。');
  return {
    main,
    thumbnail,
    metadata: {
      storageKey: `${keyPrefix}/main.jpg`,
      thumbKey: `${keyPrefix}/thumb.jpg`,
      localMainBlobKey: main.objectUrl,
      localThumbBlobKey: thumbnail.objectUrl,
      width: main.width,
      height: main.height,
      mimeType: main.mimeType,
      byteSize: main.byteSize,
      thumbByteSize: thumbnail.byteSize,
      exifStripped: true,
      originalRetained: false,
      takenAt: null
    }
  };
}

export function assertNoOriginalRetained(value: { originalRetained: boolean; exifStripped: boolean }): void {
  if (value.originalRetained || !value.exifStripped) throw new Error('不得保存原始照片與 EXIF metadata。');
}
