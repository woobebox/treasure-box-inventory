export interface PhotoFileInputOptions { accept?: string; capture?: boolean | 'environment' | 'user'; multiple?: boolean; }

export function isSupportedPhotoFile(file: File): boolean {
  return file.type.startsWith('image/') && file.size > 0;
}

export function pickPhotoFile(options: PhotoFileInputOptions = {}): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options.accept ?? 'image/*';
    input.multiple = options.multiple ?? false;
    if (options.capture) input.capture = options.capture === true ? 'environment' : options.capture;
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files?.[0] ?? null;
      input.remove();
      resolve(file && isSupportedPhotoFile(file) ? file : null);
    }, { once: true });
    document.body.append(input);
    input.click();
  });
}
