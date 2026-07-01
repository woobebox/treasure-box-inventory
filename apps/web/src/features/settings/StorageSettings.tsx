import { useEffect, useState } from 'react';

export function StorageSettings() {
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null); const [persistent, setPersistent] = useState<boolean | null>(null);
  useEffect(() => { void navigator.storage?.estimate?.().then(setEstimate); void navigator.storage?.persisted?.().then(setPersistent); }, []);
  async function requestPersistence() { if (navigator.storage?.persist) setPersistent(await navigator.storage.persist()); }
  const usage = estimate?.usage ? Math.round(estimate.usage / 1024 / 1024) : 0; const quota = estimate?.quota ? Math.round(estimate.quota / 1024 / 1024) : 0;
  return <div className="space-y-4"><h2 className="font-semibold text-slate-900">離線儲存空間</h2><p className="text-sm text-slate-600">預估已使用：{usage} MB / {quota || '未知'} MB。</p><p className="text-sm text-slate-600">持久化儲存：{persistent === null ? '檢查中' : persistent ? '已允許' : '尚未允許'}</p><button type="button" onClick={requestPersistence} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">申請持久化儲存</button></div>;
}
