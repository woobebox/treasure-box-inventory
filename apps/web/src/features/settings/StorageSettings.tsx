import { useEffect, useState } from 'react';

export function StorageSettings() {
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null); const [persistent, setPersistent] = useState<boolean | null>(null);
  useEffect(() => { void navigator.storage?.estimate?.().then(setEstimate); void navigator.storage?.persisted?.().then(setPersistent); }, []);
  async function requestPersistence() { if (navigator.storage?.persist) setPersistent(await navigator.storage.persist()); }
  const usage = estimate?.usage ? Math.round(estimate.usage / 1024 / 1024) : 0; const quota = estimate?.quota ? Math.round(estimate.quota / 1024 / 1024) : 0;
  return <div className="space-y-4"><h2 className="font-semibold text-slate-900">Offline storage</h2><p className="text-sm text-slate-600">Estimated usage: {usage} MB of {quota || 'unknown'} MB.</p><p className="text-sm text-slate-600">Persistent storage: {persistent === null ? 'checking' : persistent ? 'granted' : 'not granted'}</p><button type="button" onClick={requestPersistence} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Request persistent storage</button></div>;
}
