import { useEffect, useState } from 'react';
import { db } from '../../db/database';

// Resolve a set of photo ids to object URLs from the device-local photoBlobs
// store, revoking them on change/unmount. Returns a map of photoId -> URL.
export function usePhotoThumbnails(photoIds: string[]): Record<string, string> {
  const key = photoIds.join(',');
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    const created: string[] = [];
    let active = true;
    void (async () => {
      const entries: Record<string, string> = {};
      for (const id of photoIds) {
        const record = await db.photoBlobs.get(id);
        if (record) { const url = URL.createObjectURL(record.thumbnail); entries[id] = url; created.push(url); }
      }
      if (active) setUrls(entries); else created.forEach((url) => URL.revokeObjectURL(url));
    })();
    return () => { active = false; created.forEach((url) => URL.revokeObjectURL(url)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}
