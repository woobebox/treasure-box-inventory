import { db } from './database';
import type { Photo } from '../domain/types';

export type PhotoDraft = Omit<Photo, 'exifStripped' | 'originalRetained' | 'deletedAt' | 'version'> & { exifStripped?: true; originalRetained?: false };

export function buildPhotoMetadata(draft: PhotoDraft): Photo {
  if (!draft.householdId.trim()) throw new Error('缺少家庭識別碼');
  if (!draft.itemId.trim()) throw new Error('缺少物品識別碼');
  if (!draft.storageKey.trim() || !draft.thumbKey.trim()) throw new Error('缺少壓縮照片儲存鍵');
  if (draft.byteSize <= 0 || draft.thumbByteSize <= 0) throw new Error('照片大小必須大於 0');
  return { ...draft, exifStripped: true, originalRetained: false, deletedAt: null, version: 1 };
}

export async function putPhotoMetadata(photo: Photo): Promise<string> {
  if (!photo.householdId) throw new Error('缺少家庭識別碼');
  if (photo.originalRetained !== false || photo.exifStripped !== true) throw new Error('只能儲存已壓縮且移除 EXIF 的照片 metadata');
  return db.photos.put(photo);
}

export async function listPhotosForItem(householdId: string, itemId: string): Promise<Photo[]> {
  if (!householdId.trim()) throw new Error('缺少家庭識別碼');
  return db.photos.where('itemId').equals(itemId).filter((photo) => photo.householdId === householdId && !photo.deletedAt).toArray();
}
