import { useEffect, useState } from 'react';
import { db } from '../../db/database';

// Resolve an item's cover thumbnail to a usable object URL from the device-local
// photoBlobs store, revoking it on cleanup. Returns null when there is no photo.
export function useCoverThumbnail(coverPhotoId?: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    let active = true;
    // Resolve through a promise so state updates happen in a callback, not
    // synchronously in the effect body. A missing photo resolves to null.
    void Promise.resolve(coverPhotoId ? db.photoBlobs.get(coverPhotoId) : undefined).then((record) => {
      if (!active) return;
      if (record) { objectUrl = URL.createObjectURL(record.thumbnail); setUrl(objectUrl); }
      else setUrl(null);
    });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [coverPhotoId]);
  return url;
}
