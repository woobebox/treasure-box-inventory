import { useState } from 'react';
import { capturePhoto, choosePhotoFallback } from '../../media/cameraCapture';
import { processImage } from '../../media/imageProcessor';
import { buildRetainedPhotoPayload, type RetainedPhotoPayload } from '../../media/photoRetentionPolicy';
import { generateThumbnail } from '../../media/thumbnail';
import { Button } from '../../components/ui';

interface PhotoInputProps { value?: RetainedPhotoPayload; onChange: (photo?: RetainedPhotoPayload) => void; }

export function PhotoInput({ value, onChange }: PhotoInputProps) {
  const [status, setStatus] = useState('');
  const [processing, setProcessing] = useState(false);

  async function handlePick(mode: 'camera' | 'file') {
    if (processing) return;
    setProcessing(true);
    setStatus('正在本機處理照片...');
    try {
      const captured = mode === 'camera' ? await capturePhoto() : await choosePhotoFallback();
      if (!captured) { setStatus('尚未選擇照片。'); return; }
      const [main, thumbnail] = await Promise.all([processImage(captured.file), generateThumbnail(captured.file)]);
      onChange(buildRetainedPhotoPayload(main, thumbnail, `local/${crypto.randomUUID()}`));
      setStatus('壓縮主圖與縮圖已就緒，原始檔不會被保存。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '照片處理失敗。');
    } finally {
      setProcessing(false);
    }
  }

  return <div className="page-section space-y-3" aria-busy={processing}><div><p className="text-sm font-semibold text-slate-800">照片隱私</p><p className="mt-1 text-xs leading-5 text-slate-600">只保留重新編碼後的圖片與縮圖，不保存原圖。</p></div>{value ? <img src={value.thumbnail.objectUrl} alt="壓縮縮圖預覽" className="h-28 w-28 rounded-2xl object-cover ring-1 ring-slate-200" /> : null}<div className="flex flex-wrap gap-2"><Button type="button" variant="primary" size="md" busy={processing} onClick={() => void handlePick('camera')}>拍照</Button><Button type="button" variant="secondary" size="md" disabled={processing} onClick={() => void handlePick('file')}>上傳</Button>{value ? <Button type="button" variant="danger" size="md" disabled={processing} onClick={() => onChange(undefined)}>移除</Button> : null}</div>{status ? <p aria-live="polite" className="rounded-2xl bg-slate-100 p-3 text-xs leading-5 text-slate-700">{status}</p> : null}</div>;
}
