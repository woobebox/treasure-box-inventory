import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { listPhotosForItem } from '../../db/photoRepository';
import { db } from '../../db/database';
import type { Photo } from '../../domain/types';
import { addPhoto } from './addPhoto';
import { removePhoto } from './removePhoto';
import { usePhotoThumbnails } from './usePhotoThumbnails';
import { PhotoInput } from './PhotoInput';
import { useToast } from '../../components/toast/toastContext';
import type { RetainedPhotoPayload } from '../../media/photoRetentionPolicy';
import { Button, ConfirmDialog, IconButton } from '../../components/ui';

interface Props { householdId: string; itemId: string; itemName: string; actorId: string; deviceId: string; coverPhotoId?: string | null; onChanged: () => void; }

export function PhotoGallery({ householdId, itemId, itemName, actorId, deviceId, coverPhotoId, onChanged }: Props) {
  const { show } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [draft, setDraft] = useState<RetainedPhotoPayload | undefined>();
  const [busy, setBusy] = useState(false);
  const [busyPhotoId, setBusyPhotoId] = useState<string | null>(null);
  const [removePhotoId, setRemovePhotoId] = useState<string | null>(null);
  const urls = usePhotoThumbnails(photos.map((photo) => photo.id));

  async function reload() { setPhotos(await listPhotosForItem(householdId, itemId)); }
  useEffect(() => {
    let active = true;
    void listPhotosForItem(householdId, itemId).then((rows) => { if (active) setPhotos(rows); });
    return () => { active = false; };
  }, [householdId, itemId]);

  async function handleAdd() {
    if (!draft) return;
    setBusy(true);
    try { await addPhoto({ householdId, itemId, actorId, deviceId, payload: draft }); setDraft(undefined); show('已新增照片'); await reload(); onChanged(); }
    catch (error) { show(error instanceof Error ? error.message : '新增照片失敗', 'error'); }
    finally { setBusy(false); }
  }

  async function handleRemove(photoId: string) {
    setBusyPhotoId(photoId);
    try { await removePhoto({ householdId, itemId, photoId, actorId, deviceId }); show('已移除照片'); setRemovePhotoId(null); await reload(); onChanged(); }
    catch (error) { show(error instanceof Error ? error.message : '移除照片失敗', 'error'); }
    finally { setBusyPhotoId(null); }
  }

  async function setCover(photoId: string) {
    setBusyPhotoId(photoId);
    try {
      await db.items.update(itemId, { coverPhotoId: photoId, updatedAt: new Date().toISOString() });
      show('已設為封面'); onChanged();
    } catch (error) {
      show(error instanceof Error ? error.message : '設定封面失敗', 'error');
    } finally {
      setBusyPhotoId(null);
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-slate-900">照片</h3>
      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li key={photo.id} className="relative overflow-hidden rounded-xl border border-slate-200">
              {urls[photo.id] ? <img src={urls[photo.id]} alt={`${itemName}照片 ${index + 1}`} loading="lazy" className="aspect-square w-full object-cover" /> : <div className="aspect-square w-full bg-slate-100" />}
              {coverPhotoId === photo.id ? <span className="absolute left-1 top-1 rounded-full bg-teal-700 px-1.5 py-0.5 text-[10px] text-white">封面</span> : null}
              <div className="absolute bottom-1 right-1 flex gap-1">
                {coverPhotoId !== photo.id ? <IconButton aria-label="設為封面" disabled={busyPhotoId !== null} onClick={() => void setCover(photo.id)} className="rounded-xl bg-white/95 shadow-sm"><Star aria-hidden="true" className="h-4 w-4" /></IconButton> : null}
                <IconButton variant="danger" aria-label="移除照片" disabled={busyPhotoId !== null} onClick={() => setRemovePhotoId(photo.id)} className="rounded-xl bg-white/95 shadow-sm"><Trash2 aria-hidden="true" className="h-4 w-4" /></IconButton>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-600">尚無照片。</p>}

      <PhotoInput value={draft} onChange={setDraft} />
      {draft ? <Button type="button" onClick={() => void handleAdd()} busy={busy} fullWidth>新增此照片</Button> : null}
      <ConfirmDialog open={Boolean(removePhotoId)} title="移除這張照片？" description="照片會從此物品移除；如果它是封面，系統會自動改用其他照片。" confirmLabel="確認移除" busy={Boolean(busyPhotoId)} onCancel={() => setRemovePhotoId(null)} onConfirm={() => { if (removePhotoId) void handleRemove(removePhotoId); }} />
    </section>
  );
}
