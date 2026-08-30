import { useState } from 'react';
import { capturePhoto, choosePhotoFallback } from '../../media/cameraCapture';
import { processImage } from '../../media/imageProcessor';
import { buildRetainedPhotoPayload, type RetainedPhotoPayload } from '../../media/photoRetentionPolicy';
import { generateThumbnail } from '../../media/thumbnail';

interface PhotoInputProps { value?: RetainedPhotoPayload; onChange: (photo?: RetainedPhotoPayload) => void; }

export function PhotoInput({ value, onChange }: PhotoInputProps) {
  const [status, setStatus] = useState('');

  async function handlePick(mode: 'camera' | 'file') {
    setStatus('正在本機處理照片...');
    try {
      const captured = mode === 'camera' ? await capturePhoto() : await choosePhotoFallback();
      if (!captured) { setStatus('尚未選擇照片。'); return; }
      const [main, thumbnail] = await Promise.all([processImage(captured.file), generateThumbnail(captured.file)]);
      onChange(buildRetainedPhotoPayload(main, thumbnail, `local/${crypto.randomUUID()}`));
      setStatus('壓縮主圖與縮圖已就緒，原始檔不會被保存。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '照片處理失敗。');
    }
  }

  return <div className="space-y-2 rounded-2xl border border-slate-200 p-3"><p className="text-sm font-medium text-slate-700">照片隱私</p>{value ? <img src={value.thumbnail.objectUrl} alt="壓縮縮圖預覽" className="h-24 w-24 rounded-xl object-cover" /> : <p className="text-sm text-slate-500">只保留重新編碼後的圖片與縮圖，不保存原圖。</p>}<div className="flex gap-2"><button type="button" onClick={() => void handlePick('camera')} className="rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white">拍照</button><button type="button" onClick={() => void handlePick('file')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">上傳</button>{value ? <button type="button" onClick={() => onChange(undefined)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">移除</button> : null}</div>{status ? <p className="text-xs text-slate-500">{status}</p> : null}</div>;
}
