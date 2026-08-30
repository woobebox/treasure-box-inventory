import { useHousehold } from '../../services/householdContextValue';
import { supabase } from '../../services/supabaseClient';
import { requestSync } from '../../sync/syncScheduler';
import { useSyncStatus } from '../../sync/useSyncStatus';

export function SyncSettings() {
  const { householdId, householdName, deviceId } = useHousehold();
  const sync = useSyncStatus();

  const isSyncing = sync.phase === 'syncing';
  const statusColor = sync.phase === 'error' ? 'text-rose-600' : sync.phase === 'success' ? 'text-teal-700' : 'text-slate-600';
  return (
    <section className="space-y-3" aria-busy={isSyncing}>
      <h2 className="font-semibold text-slate-900">雲端同步</h2>
      {supabase
        ? <p className="text-xs text-slate-500">家庭：{householdName || householdId || '（未選擇）'} · 裝置：{deviceId.slice(0, 8)} · 寫入後與回到 App 時會自動同步</p>
        : <p className="text-xs text-amber-600">尚未設定 Supabase，目前為純離線模式。</p>}
      <button type="button" disabled={isSyncing || !sync.enabled} onClick={() => void requestSync('manual')} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {isSyncing ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />同步中…</> : '立即同步'}
      </button>
      <p className={`text-sm ${statusColor}`}>{sync.message}</p>
      {sync.pendingCount > 0 && !isSyncing ? <p className="text-xs text-slate-500">尚有 {sync.pendingCount} 筆待同步作業。</p> : null}
      {sync.reasons.length > 0 ? <ul className="space-y-1 text-xs text-rose-500">{sync.reasons.map((reason) => <li key={reason}>· {reason}</li>)}</ul> : null}
    </section>
  );
}
