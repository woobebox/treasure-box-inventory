import { useState } from 'react';
import { pushOutbox } from '../../sync/outbox';
import { pullChanges } from '../../sync/pull';
import { useHousehold } from '../../services/householdContextValue';
import { supabase } from '../../services/supabaseClient';

type SyncState = 'idle' | 'syncing' | 'success' | 'error';

export function SyncSettings() {
  const { householdId, householdName, deviceId } = useHousehold();
  const [state, setState] = useState<SyncState>('idle');
  const [message, setMessage] = useState('尚未執行同步。');
  const [reasons, setReasons] = useState<string[]>([]);

  async function syncNow() {
    setState('syncing'); setMessage('同步中，請勿離開或重複操作…'); setReasons([]);
    try {
      const pushed = await pushOutbox(householdId, deviceId);
      const pulled = await pullChanges(householdId, deviceId);
      setReasons(pushed.reasons ?? []);
      setState(pushed.conflicted > 0 || pushed.failed > 0 ? 'error' : 'success');
      setMessage(`已推送 ${pushed.synced} 筆，失敗 ${pushed.failed} 筆，衝突 ${pushed.conflicted} 筆，拉取 ${pulled.applied} 筆。`);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '同步失敗。');
    }
  }

  const isSyncing = state === 'syncing';
  const statusColor = state === 'error' ? 'text-rose-600' : state === 'success' ? 'text-teal-700' : 'text-slate-600';
  return (
    <section className="space-y-3" aria-busy={isSyncing}>
      <h2 className="font-semibold text-slate-900">雲端同步</h2>
      {supabase ? <p className="text-xs text-slate-500">家庭：{householdName || householdId || '（未選擇）'} · 裝置：{deviceId.slice(0, 8)}</p> : <p className="text-xs text-amber-600">尚未設定 Supabase，目前為純離線模式。</p>}
      <button type="button" disabled={isSyncing || !supabase || !householdId} onClick={() => void syncNow()} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {isSyncing ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />同步中…</> : '立即同步'}
      </button>
      <p className={`text-sm ${statusColor}`}>{message}</p>
      {reasons.length > 0 ? <ul className="space-y-1 text-xs text-rose-500">{reasons.map((reason) => <li key={reason}>· {reason}</li>)}</ul> : null}
    </section>
  );
}
