import { pickPhotoFile } from './fileInput';

export interface CapturedPhoto { file: File; source: 'camera' | 'file-fallback'; }

export async function capturePhoto(): Promise<CapturedPhoto | null> {
  const file = await pickPhotoFile({ accept: 'image/*', capture: 'environment' });
  return file ? { file, source: 'camera' } : null;
}

export async function choosePhotoFallback(): Promise<CapturedPhoto | null> {
  const file = await pickPhotoFile({ accept: 'image/*' });
  return file ? { file, source: 'file-fallback' } : null;
}
