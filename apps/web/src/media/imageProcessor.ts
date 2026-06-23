export interface ProcessedImage { blob: Blob; width: number; height: number; mimeType: 'image/jpeg'; byteSize: number; objectUrl: string; }
export interface ProcessImageOptions { maxDimension?: number; quality?: number; }

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) return createImageBitmap(file, { imageOrientation: 'from-image' });
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unable to decode image')); };
    image.src = url;
  });
}

function fit(width: number, height: number, maxDimension: number): { width: number; height: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function processImage(file: File | Blob, options: ProcessImageOptions = {}): Promise<ProcessedImage> {
  const decoded = await decode(file);
  const sourceWidth = decoded.width;
  const sourceHeight = decoded.height;
  const size = fit(sourceWidth, sourceHeight, options.maxDimension ?? 1600);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  context.drawImage(decoded, 0, 0, size.width, size.height);
  if ('close' in decoded && typeof decoded.close === 'function') decoded.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Unable to encode image')), 'image/jpeg', options.quality ?? 0.82));
  return { blob, width: size.width, height: size.height, mimeType: 'image/jpeg', byteSize: blob.size, objectUrl: URL.createObjectURL(blob) };
}
