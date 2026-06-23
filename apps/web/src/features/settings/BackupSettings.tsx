import { useState } from 'react';
import { db } from '../../db/database';
import { exportItemsCsv } from '../backup/exportCsv';
import { exportManifest } from '../backup/exportManifest';
import { restoreDryRun, type RestoreDryRunResult } from '../backup/restoreDryRun';

const demoHouseholdId = 'local-demo-household';

export function BackupSettings() {
  const [message, setMessage] = useState('');
  const [dryRun, setDryRun] = useState<RestoreDryRunResult | null>(null);
  async function downloadJson() { const manifest = await exportManifest(demoHouseholdId); setMessage(`Exported manifest with ${manifest.items.length} items and ${manifest.photos.length} compressed photos.`); }
  async function downloadCsv() { const items = await db.items.where('householdId').equals(demoHouseholdId).toArray(); setMessage(`CSV ready with ${exportItemsCsv(items).split('\n').length - 1} rows.`); }
  async function validate(file: File) { setDryRun(restoreDryRun(JSON.parse(await file.text()))); }
  return <div className="space-y-3"><h2 className="font-semibold text-slate-900">Backup and restore</h2><p className="text-sm text-slate-600">Exports include JSON manifests and CSV summaries. Originals are excluded by policy.</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void downloadJson()} className="rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Export JSON</button><button type="button" onClick={() => void downloadCsv()} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Export CSV</button><label className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Dry-run restore<input className="hidden" type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void validate(file); }} /></label></div>{message ? <p className="text-sm text-slate-600">{message}</p> : null}{dryRun ? <p className={dryRun.valid ? 'text-sm text-teal-700' : 'text-sm text-red-700'}>{dryRun.valid ? `Valid backup: ${dryRun.counts.items} items.` : dryRun.errors.join(' ')}</p> : null}</div>;
}
