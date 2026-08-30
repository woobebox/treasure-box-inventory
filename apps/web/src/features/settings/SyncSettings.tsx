import { useHousehold } from '../../services/householdContextValue';
import { supabase } from '../../services/supabaseClient';
import { requestSync } from '../../sync/syncScheduler';
import { useSyncStatus } from '../../sync/useSyncStatus';
import { Button } from '../../components/ui';

export function SyncSettings() {
  const { householdId, householdName, deviceId } = useHousehold();
  const sync = useSyncStatus();

  const isSyncing = sync.phase === 'syncing';
  const statusColor = sync.phase === 'error' ? 'text-rose-600' : sync.phase === 'success' ? 'text-teal-700' : 'text-slate-600';
  return (
    <section className="page-section space-y-4" aria-busy={isSyncing}>
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">連線狀態</p><h2 className="mt-1 text-lg font-bold text-slate-900">雲端同步</h2></div>
      {supabase
        ? <p className="text-xs text-slate-600">家庭：{householdName || householdId || '（未選擇）'} · 裝置：{deviceId.slice(0, 8)} · 寫入後與回到 App 時會自動同步</p>
        : <p className="text-xs font-medium text-amber-800">尚未設定 Supabase，目前為純離線模式。</p>}
      <Button type="button" disabled={!sync.enabled} busy={isSyncing} onClick={() => void requestSync('manual')}>立即同步</Button>
      <p aria-live="polite" className={`rounded-2xl bg-slate-50 p-3 text-sm ${statusColor}`}>{sync.message}</p>
      {sync.lastCompletedAt ? <p className="text-xs text-slate-600">最近完成：{new Date(sync.lastCompletedAt).toLocaleString('zh-TW')}</p> : null}
      {sync.pendingCount > 0 && !isSyncing ? <p className="text-xs text-slate-600">尚有 {sync.pendingCount} 筆待同步作業。</p> : null}
      {sync.reasons.length > 0 ? <ul className="space-y-1 text-xs text-rose-700">{sync.reasons.map((reason) => <li key={reason}>· {reason}</li>)}</ul> : null}
    </section>
  );
}
