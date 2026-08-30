import { useEffect, useState } from 'react';
import { Button } from '../../components/ui';

export function StorageSettings() {
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void navigator.storage?.estimate?.().then(setEstimate).catch(() => undefined);
    void navigator.storage?.persisted?.().then(setPersistent).catch(() => setPersistent(false));
  }, []);

  async function requestPersistence() {
    if (!navigator.storage?.persist || persistent) return;
    setRequesting(true);
    setMessage('');
    try {
      const allowed = await navigator.storage.persist();
      setPersistent(allowed);
      setMessage(allowed ? '瀏覽器已允許持久化儲存。' : '瀏覽器未授權；App 仍可使用，但空間不足時資料可能被清理。');
    } catch {
      setMessage('無法申請持久化儲存，請檢查瀏覽器設定後重試。');
    } finally {
      setRequesting(false);
    }
  }

  const usage = estimate?.usage ? Math.round(estimate.usage / 1024 / 1024) : 0;
  const quota = estimate?.quota ? Math.round(estimate.quota / 1024 / 1024) : 0;
  return <section className="page-section space-y-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">裝置狀態</p><h2 className="mt-1 text-lg font-bold text-slate-900">離線儲存空間</h2></div><p className="text-sm leading-6 text-slate-600">預估已使用：{usage} MB / {quota || '未知'} MB。</p><p className="text-sm leading-6 text-slate-600">持久化儲存：{persistent === null ? '檢查中' : persistent ? '已允許' : '尚未允許'}</p><Button type="button" variant="secondary" busy={requesting} disabled={persistent === true || !navigator.storage?.persist} onClick={() => void requestPersistence()}>{persistent ? '已啟用持久化儲存' : '申請持久化儲存'}</Button>{message ? <p role="status" className="rounded-2xl bg-slate-50 p-3 text-sm leading-5 text-slate-700">{message}</p> : null}</section>;
}
