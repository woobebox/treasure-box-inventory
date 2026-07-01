export function backupFilename(extension: 'json' | 'csv', now = new Date()): string {
  return `treasure-box-${now.toISOString().slice(0, 10)}.${extension}`;
}

export function createTextFileUrl(contents: string, mimeType: string): string {
  return URL.createObjectURL(new Blob([contents], { type: `${mimeType};charset=utf-8` }));
}
