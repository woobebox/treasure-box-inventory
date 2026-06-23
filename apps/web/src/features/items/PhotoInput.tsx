import { useState } from 'react';
import { capturePhoto, choosePhotoFallback } from '../../media/cameraCapture';
import { processImage } from '../../media/imageProcessor';
import { buildRetainedPhotoPayload, type RetainedPhotoPayload } from '../../media/photoRetentionPolicy';
import { generateThumbnail } from '../../media/thumbnail';

interface PhotoInputProps { value?: RetainedPhotoPayload; onChange: (photo?: RetainedPhotoPayload) => void; }

export function PhotoInput({ value, onChange }: PhotoInputProps) {
  const [status, setStatus] = useState('');

  async function handlePick(mode: 'camera' | 'file') {
    setStatus('Processing photo locally...');
    try {
      const captured = mode === 'camera' ? await capturePhoto() : await choosePhotoFallback();
      if (!captured) { setStatus('No photo selected.'); return; }
      const [main, thumbnail] = await Promise.all([processImage(captured.file), generateThumbnail(captured.file)]);
      onChange(buildRetainedPhotoPayload(main, thumbnail, `local/${crypto.randomUUID()}`));
      setStatus('Compressed photo and thumbnail are ready. Original file was not stored.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Photo processing failed.');
    }
  }

  return <div className="space-y-2 rounded-2xl border border-slate-200 p-3"><p className="text-sm font-medium text-slate-700">Photo privacy</p>{value ? <img src={value.thumbnail.objectUrl} alt="Compressed thumbnail preview" className="h-24 w-24 rounded-xl object-cover" /> : <p className="text-sm text-slate-500">Only canvas re-encoded images and thumbnails are retained.</p>}<div className="flex gap-2"><button type="button" onClick={() => void handlePick('camera')} className="rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Camera</button><button type="button" onClick={() => void handlePick('file')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Upload</button>{value ? <button type="button" onClick={() => onChange(undefined)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Remove</button> : null}</div>{status ? <p className="text-xs text-slate-500">{status}</p> : null}</div>;
}
