export interface ProcessedImage { blob: Blob; width: number; height: number; mimeType: 'image/jpeg'; byteSize: number; objectUrl: string; }
export interface ProcessImageOptions { maxDimension?: number; quality?: number; }

// Identify the real file format from its leading magic bytes, since the OS sets
// the MIME type from the file extension and can be wrong (e.g. a HEIC renamed
// to .png). Helps explain why a browser refuses to decode a supposed PNG.
async function sniffFormat(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hex.startsWith('89504e47')) return 'PNG';
  if (hex.startsWith('ffd8ff')) return 'JPEG';
  if (hex.startsWith('47494638')) return 'GIF';
  if (hex.startsWith('52494646') && bytes[8] === 0x57) return 'WEBP';
  // ISO-BMFF 'ftyp' box at offset 4 → HEIC/HEIF/AVIF family
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    return `HEIC/HEIF (${brand.trim()})`;
  }
  return `未知 (位元組起始 ${hex.slice(0, 12)})`;
}

function decodeViaImageElement(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('<img> 無法載入這個檔案')); };
    image.src = url;
  });
}

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  // Prefer createImageBitmap, but fall back to an <img> element when it throws
  // (some browsers/codecs reject it). Surface the real underlying errors so we
  // can tell a genuinely unsupported codec (e.g. HEIC) from other failures.
  const reasons: string[] = [];
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (cause) {
      reasons.push(`createImageBitmap: ${cause instanceof Error ? cause.message : String(cause)}`);
    }
  }
  try {
    return await decodeViaImageElement(file);
  } catch (cause) {
    reasons.push(cause instanceof Error ? cause.message : String(cause));
  }
  const actualFormat = await sniffFormat(file);
  const declaredType = (file as File).type || '未知';
  if (actualFormat.startsWith('HEIC')) {
    throw new Error(`這是 HEIC/HEIF 格式（副檔名雖為 ${declaredType}，實際檔案為 ${actualFormat}），桌面瀏覽器無法解碼。請改用 JPEG 或 PNG，或在手機設定改用「相容性最佳（JPEG）」拍攝。`);
  }
  throw new Error(`無法解碼圖片（宣告 type=${declaredType}，實際格式=${actualFormat}，size=${file.size}）：${reasons.join('；')}`);
}

function fit(width: number, height: number, maxDimension: number): { width: number; height: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function processImage(file: File | Blob, options: ProcessImageOptions = {}): Promise<ProcessedImage> {
  const decoded = await decode(file);
  // <img> reports the decoded size via naturalWidth/Height; ImageBitmap uses width/height.
  const sourceWidth = (decoded as HTMLImageElement).naturalWidth || decoded.width;
  const sourceHeight = (decoded as HTMLImageElement).naturalHeight || decoded.height;
  const size = fit(sourceWidth, sourceHeight, options.maxDimension ?? 1600);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('此瀏覽器無法使用 Canvas 處理圖片');
  context.drawImage(decoded, 0, 0, size.width, size.height);
  if ('close' in decoded && typeof decoded.close === 'function') decoded.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('無法重新編碼圖片')), 'image/jpeg', options.quality ?? 0.82));
  return { blob, width: size.width, height: size.height, mimeType: 'image/jpeg', byteSize: blob.size, objectUrl: URL.createObjectURL(blob) };
}
