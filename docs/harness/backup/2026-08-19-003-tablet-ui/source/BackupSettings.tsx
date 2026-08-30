import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../components/toast/toastContext';
import { db } from '../../db/database';
import { backupFilename, createTextFileUrl } from '../backup/downloadFile';
import { exportItemsCsv } from '../backup/exportCsv';
import { exportManifest, type BackupManifest } from '../backup/exportManifest';
import { restoreDryRun, type RestoreDryRunResult } from '../backup/restoreDryRun';
import { restoreManifest } from '../backup/restoreManifest';
import { useHousehold } from '../../services/householdContextValue';

interface RestoreCandidate {
  filename: string;
  manifest: BackupManifest;
  dryRun: RestoreDryRunResult;
}

interface PreparedDownloads {
  jsonUrl: string;
  csvUrl: string;
  jsonFilename: string;
  csvFilename: string;
  items: number;
  locations: number;
  photos: number;
}

const backupActionClass = 'inline-flex cursor-pointer items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2';
const preparingActionClass = 'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-400';

export function BackupSettings() {
  const { householdId } = useHousehold();
  const { show } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [candidate, setCandidate] = useState<RestoreCandidate | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [downloadRevision, setDownloadRevision] = useState(0);
  const [downloads, setDownloads] = useState<PreparedDownloads | null>(null);

  useEffect(() => {
    let disposed = false;
    let urls: string[] = [];
    void Promise.all([
      exportManifest(householdId),
      db.items.where('householdId').equals(householdId).toArray(),
    ]).then(([manifest, items]) => {
      if (disposed) return;
      const jsonUrl = createTextFileUrl(JSON.stringify(manifest, null, 2), 'application/json');
      const csvUrl = createTextFileUrl(`\uFEFF${exportItemsCsv(items)}`, 'text/csv');
      urls = [jsonUrl, csvUrl];
      setDownloads({
        jsonUrl,
        csvUrl,
        jsonFilename: backupFilename('json'),
        csvFilename: backupFilename('csv'),
        items: manifest.items.length,
        locations: manifest.locations.length,
        photos: manifest.photos.length,
      });
    }).catch((error: unknown) => {
      if (!disposed) show(error instanceof Error ? error.message : '準備備份檔案失敗', 'error');
    });
    return () => {
      disposed = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [downloadRevision, householdId, show]);

  function downloadedJson() {
    if (downloads) {
      setMessage(`已開始下載 JSON，包含 ${downloads.items} 件物品、${downloads.locations} 個位置與 ${downloads.photos} 筆照片 metadata。`);
    }
  }

  function downloadedCsv() {
    if (downloads) setMessage(`已開始下載 CSV，共 ${downloads.items} 列物品摘要。`);
  }

  async function inspectBackup(file: File) {
    setCandidate(null);
    try {
      const manifest = JSON.parse(await file.text()) as BackupManifest;
      const dryRun = restoreDryRun(manifest);
      setCandidate({ filename: file.name, manifest, dryRun });
    } catch {
      setCandidate({ filename: file.name, manifest: {} as BackupManifest, dryRun: { valid: false, errors: ['無法解析 JSON 檔案。'], counts: {} } });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function confirmRestore() {
    if (!candidate?.dryRun.valid) return;
    setRestoring(true);
    try {
      const result = await restoreManifest(householdId, candidate.manifest);
      setMessage(`還原完成：已合併 ${result.items} 件物品、${result.locations} 個位置、${result.tags} 個標籤與 ${result.history} 筆歷史。`);
      setCandidate(null);
      setDownloads(null);
      setDownloadRevision((revision) => revision + 1);
      show('JSON 備份還原完成');
    } catch (error) {
      show(error instanceof Error ? error.message : '還原失敗', 'error');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-slate-900">備份與還原</h2>
      <p className="text-sm text-slate-600">JSON 用於完整資料結構備份與還原；CSV 只是可用試算表開啟的物品摘要，不能完整還原。</p>
      <div className="flex flex-wrap gap-2">
        {downloads ? <a href={downloads.jsonUrl} download={downloads.jsonFilename} onClick={downloadedJson} className={backupActionClass}>下載 JSON 備份</a> : <span className={preparingActionClass}>準備 JSON…</span>}
        {downloads ? <a href={downloads.csvUrl} download={downloads.csvFilename} onClick={downloadedCsv} className={backupActionClass}>下載 CSV 摘要</a> : <span className={preparingActionClass}>準備 CSV…</span>}
        <label className={backupActionClass}>
          匯入 JSON 備份資料
          <input ref={fileInputRef} className="hidden" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void inspectBackup(file); }} />
        </label>
      </div>
      <p className="text-xs text-slate-500">匯入前會先檢查格式並顯示筆數，不會直接覆蓋資料。確認後採安全合併：相同 ID 更新，其餘現有資料保留。</p>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      {candidate ? (
        <div className={`rounded-xl border p-3 ${candidate.dryRun.valid ? 'border-teal-200 bg-teal-50' : 'border-red-200 bg-red-50'}`}>
          <p className="text-sm font-semibold text-slate-900">{candidate.filename}</p>
          {candidate.dryRun.valid ? (
            <>
              <p className="mt-1 text-sm text-teal-800">格式有效：{candidate.dryRun.counts.items} 件物品、{candidate.dryRun.counts.locations} 個位置、{candidate.dryRun.counts.tags} 個標籤。</p>
              <button type="button" disabled={restoring} onClick={() => void confirmRestore()} className="mt-3 rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{restoring ? '還原中…' : '確認匯入並合併'}</button>
            </>
          ) : <p className="mt-1 text-sm text-red-700">{candidate.dryRun.errors.join(' ')}</p>}
        </div>
      ) : null}
    </div>
  );
}
