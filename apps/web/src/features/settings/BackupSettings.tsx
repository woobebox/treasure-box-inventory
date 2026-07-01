import { useState } from 'react';
import { db } from '../../db/database';
import { exportItemsCsv } from '../backup/exportCsv';
import { exportManifest } from '../backup/exportManifest';
import { restoreDryRun, type RestoreDryRunResult } from '../backup/restoreDryRun';
import { useHousehold } from '../../services/householdContextValue';

export function BackupSettings() {
  const { householdId } = useHousehold();
  const [message, setMessage] = useState('');
  const [dryRun, setDryRun] = useState<RestoreDryRunResult | null>(null);
  async function downloadJson() { const manifest = await exportManifest(householdId); setMessage(`已匯出 manifest，包含 ${manifest.items.length} 件物品與 ${manifest.photos.length} 張壓縮照片。`); }
  async function downloadCsv() { const items = await db.items.where('householdId').equals(householdId).toArray(); setMessage(`CSV 已就緒，共 ${exportItemsCsv(items).split('\n').length - 1} 列。`); }
  async function validate(file: File) { setDryRun(restoreDryRun(JSON.parse(await file.text()))); }
  return <div className="space-y-3"><h2 className="font-semibold text-slate-900">備份與還原</h2><p className="text-sm text-slate-600">匯出內容包含 JSON manifest 與 CSV 摘要；依隱私政策不包含原始照片。</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void downloadJson()} className="rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white">匯出 JSON</button><button type="button" onClick={() => void downloadCsv()} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">匯出 CSV</button><label className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">試算還原<input className="hidden" type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void validate(file); }} /></label></div>{message ? <p className="text-sm text-slate-600">{message}</p> : null}{dryRun ? <p className={dryRun.valid ? 'text-sm text-teal-700' : 'text-sm text-red-700'}>{dryRun.valid ? `備份格式有效：${dryRun.counts.items} 件物品。` : dryRun.errors.join(' ')}</p> : null}</div>;
}
