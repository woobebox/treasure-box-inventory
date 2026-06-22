import { db } from './database';
import type { Photo } from '../domain/types';

export type PhotoDraft = Omit<Photo, 'exifStripped' | 'originalRetained' | 'deletedAt' | 'version'> & { exifStripped?: true; originalRetained?: false };

export function buildPhotoMetadata(draft: PhotoDraft): Photo {
  if (!draft.householdId.trim()) throw new Error('household_id is required');
  if (!draft.itemId.trim()) throw new Error('itemId is required');
  if (!draft.storageKey.trim() || !draft.thumbKey.trim()) throw new Error('Compressed photo keys are required');
  if (draft.byteSize <= 0 || draft.thumbByteSize <= 0) throw new Error('Photo sizes must be positive');
  return { ...draft, exifStripped: true, originalRetained: false, deletedAt: null, version: 1 };
}

export async function putPhotoMetadata(photo: Photo): Promise<string> {
  if (!photo.householdId) throw new Error('household_id is required');
  if (photo.originalRetained !== false || photo.exifStripped !== true) throw new Error('Only compressed EXIF-stripped photo metadata may be saved');
  return db.photos.put(photo);
}

export async function listPhotosForItem(householdId: string, itemId: string): Promise<Photo[]> {
  if (!householdId.trim()) throw new Error('household_id is required');
  return db.photos.where('itemId').equals(itemId).filter((photo) => photo.householdId === householdId && !photo.deletedAt).toArray();
}
