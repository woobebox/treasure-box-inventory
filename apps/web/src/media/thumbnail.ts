import { processImage, type ProcessedImage } from './imageProcessor';

export function generateThumbnail(file: File | Blob): Promise<ProcessedImage> {
  return processImage(file, { maxDimension: 320, quality: 0.72 });
}
