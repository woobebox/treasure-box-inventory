import { useState } from 'react';
import { pushOutbox } from '../../sync/outbox';
import { pullChanges } from '../../sync/pull';

export function SyncSettings() {
  const [householdId, setHouseholdId] = useState('local-household'); const [deviceId, setDeviceId] = useState('web-device'); const [message, setMessage] = useState('Sync has not run yet.'); const [isSyncing, setIsSyncing] = useState(false);
  async function syncNow() { setIsSyncing(true); try { const pushed = await pushOutbox(householdId, deviceId); const pulled = await pullChanges(householdId, deviceId); setMessage(`Pushed ${pushed.synced}, conflicts ${pushed.conflicted}, pulled ${pulled.applied}.`); } catch (error) { setMessage(error instanceof Error ? error.message : 'Sync failed.'); } finally { setIsSyncing(false); } }
  return <section className="space-y-3"><h2 className="font-semibold text-slate-900">Cloud sync</h2><input className="w-full rounded border p-2 text-sm" value={householdId} onChange={(event) => setHouseholdId(event.target.value)} aria-label="Household ID" /><input className="w-full rounded border p-2 text-sm" value={deviceId} onChange={(event) => setDeviceId(event.target.value)} aria-label="Device ID" /><button type="button" disabled={isSyncing} onClick={() => void syncNow()} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isSyncing ? 'Syncing…' : 'Sync now'}</button><p className="text-sm text-slate-600">{message}</p></section>;
}
