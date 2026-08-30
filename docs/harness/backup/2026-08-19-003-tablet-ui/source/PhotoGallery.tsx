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

interface Props { householdId: string; itemId: string; actorId: string; deviceId: string; coverPhotoId?: string | null; onChanged: () => void; }

export function PhotoGallery({ householdId, itemId, actorId, deviceId, coverPhotoId, onChanged }: Props) {
  const { show } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [draft, setDraft] = useState<RetainedPhotoPayload | undefined>();
  const [busy, setBusy] = useState(false);
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
    try { await removePhoto({ householdId, itemId, photoId, actorId, deviceId }); show('已移除照片'); await reload(); onChanged(); }
    catch (error) { show(error instanceof Error ? error.message : '移除照片失敗', 'error'); }
  }

  async function setCover(photoId: string) {
    await db.items.update(itemId, { coverPhotoId: photoId, updatedAt: new Date().toISOString() });
    show('已設為封面'); onChanged();
  }

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-slate-900">照片</h3>
      {photos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <li key={photo.id} className="relative overflow-hidden rounded-xl border border-slate-200">
              {urls[photo.id] ? <img src={urls[photo.id]} alt="物品照片" className="aspect-square w-full object-cover" /> : <div className="aspect-square w-full bg-slate-100" />}
              {coverPhotoId === photo.id ? <span className="absolute left-1 top-1 rounded-full bg-teal-700 px-1.5 py-0.5 text-[10px] text-white">封面</span> : null}
              <div className="absolute bottom-1 right-1 flex gap-1">
                {coverPhotoId !== photo.id ? <button type="button" aria-label="設為封面" onClick={() => void setCover(photo.id)} className="rounded-full bg-white/90 p-1 text-slate-700"><Star className="h-3.5 w-3.5" /></button> : null}
                <button type="button" aria-label="移除照片" onClick={() => void handleRemove(photo.id)} className="rounded-full bg-white/90 p-1 text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">尚無照片。</p>}

      <PhotoInput value={draft} onChange={setDraft} />
      {draft ? <button type="button" onClick={() => void handleAdd()} disabled={busy} className="w-full rounded-2xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">{busy ? '新增中…' : '新增此照片'}</button> : null}
    </section>
  );
}
