import { type ReactNode, useEffect, useState } from 'react';
import { AlertTriangle, Check, CloudOff, Map as MapIcon, MapPin, Package, Plus, RefreshCw, Search } from 'lucide-react';
import { listItemsByHousehold } from '../../db/itemRepository';
import { listLocationsByHousehold } from '../../db/locationRepository';
import type { Item } from '../../domain/types';
import { useHousehold } from '../../services/householdContextValue';
import { requestSync } from '../../sync/syncScheduler';
import { useSyncStatus } from '../../sync/useSyncStatus';
import { ItemCard } from '../items/ItemCard';
import { ActionLink, ActionTile, Button } from '../../components/ui';
import { toHref } from '../../app/basePath';
import { ErrorState, LoadingState } from '../../components/StatusState';

interface RecentItem {
  item: Item;
  locationPath: string | null;
}

function SyncIndicator() {
  const sync = useSyncStatus();
  if (!sync.enabled) {
    return (
      <p className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/15 px-3 text-sm text-teal-50 ring-1 ring-white/20">
        <CloudOff className="h-4 w-4" />純離線模式
      </p>
    );
  }
  const syncing = sync.phase === 'syncing';
  const Icon = syncing ? RefreshCw : sync.phase === 'error' ? AlertTriangle : Check;
  const tone = sync.phase === 'error' ? 'danger' : 'secondary';
  const completedAt = sync.lastCompletedAt ? new Date(sync.lastCompletedAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <div className="relative mt-4 flex flex-col items-start gap-2">
      <Button
        variant={tone}
        size="md"
        onClick={() => void requestSync('manual')}
        disabled={syncing}
        aria-label="立即同步"
        leadingIcon={<Icon aria-hidden="true" className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />}
        className="rounded-2xl"
      >
        {syncing ? '同步中…' : sync.pendingCount > 0 ? `${sync.pendingCount} 筆待同步` : sync.phase === 'error' ? '同步發生問題' : '已同步'}
      </Button>
      <p className="max-w-xl text-xs leading-5 text-teal-50/90">{completedAt ? `最近完成：${completedAt} · ${sync.message}` : sync.message}</p>
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-white/90 p-4 shadow-sm">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{icon}</div>
      <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-600">{label}</p>
    </div>
  );
}

export function HomePage() {
  const { householdId, householdName } = useHousehold();
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [summary, setSummary] = useState({ itemCount: 0, locationCount: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryRevision, setRetryRevision] = useState(0);
  const sync = useSyncStatus();

  // Reload after each sync settles so remote changes show up without a refresh.
  useEffect(() => {
    if (sync.phase === 'syncing') return;
    let active = true;
    void Promise.all([
      listItemsByHousehold(householdId),
      listLocationsByHousehold(householdId),
    ]).then(([items, locations]) => {
      if (!active) return;
      const locationPathById = new Map(locations.map((location) => [location.id, location.path]));
      const sorted = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setSummary({ itemCount: items.length, locationCount: locations.length });
      setRecent(sorted.slice(0, 5).map((item) => ({
        item,
        locationPath: locationPathById.get(item.currentLocationId) ?? null,
      })));
      setLoadError(null);
      setLoading(false);
    }).catch((cause: unknown) => {
      if (!active) return;
      setLoadError(cause instanceof Error ? cause.message : '無法載入家庭總覽');
      setLoading(false);
    });
    return () => { active = false; };
  }, [householdId, sync.phase, retryRevision]);

  return (
    <div className="flex flex-col gap-6">
      <section className="relative order-1 overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-700 via-teal-800 to-teal-950 p-6 text-white shadow-[0_18px_42px_rgb(15_118_110/0.22)] md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">目前家庭</p>
        <p className="relative mt-2 text-2xl font-bold md:text-3xl">{householdName || '本機示範家庭'}</p>
        <p className="relative mt-2 max-w-xl text-sm leading-6 text-teal-50/85">整理每一件物品，讓家中的每個位置都能被快速找到。</p>
        <SyncIndicator />
      </section>

      {loadError ? <div className="order-3"><ErrorState title="無法載入家庭總覽" message={loadError} actionLabel="重試" onAction={() => { setLoading(true); setLoadError(null); setRetryRevision((value) => value + 1); }} /></div> : null}

      {!loadError ? <section className="order-3" aria-labelledby="home-summary-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">家庭總覽</p>
            <h2 id="home-summary-heading" className="mt-1 text-xl font-bold text-slate-900">現在的收納狀態</h2>
          </div>
          <MapPin aria-hidden="true" className="h-6 w-6 text-teal-600" />
        </div>
        {loading ? <LoadingState label="正在整理家庭摘要…" rows={1} /> : (
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <Metric icon={<Package aria-hidden="true" className="h-5 w-5 text-teal-700" />} label="物品" value={summary.itemCount} tone="bg-teal-100" />
            <Metric icon={<MapIcon aria-hidden="true" className="h-5 w-5 text-sky-700" />} label="位置" value={summary.locationCount} tone="bg-sky-100" />
            <Metric icon={<RefreshCw aria-hidden="true" className="h-5 w-5 text-amber-700" />} label="待同步" value={sync.pendingCount} tone="bg-amber-100" />
          </div>
        )}
      </section> : null}

      <section className="order-2" aria-labelledby="quick-actions-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">快速操作</p>
        <h2 id="quick-actions-heading" className="mt-1 text-xl font-bold text-slate-900">想要做什麼？</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          <ActionTile href={toHref('/add')} icon={<Plus aria-hidden="true" className="text-teal-700" />} title="新增物品" description="拍照或輸入資料，立即存到本機" tone="teal" />
          <ActionTile href={toHref('/search')} icon={<Search aria-hidden="true" className="text-sky-700" />} title="搜尋物品" description="依名稱、標籤或位置快速找回" tone="slate" />
          <ActionTile href={toHref('/locations')} icon={<MapIcon aria-hidden="true" className="text-amber-700" />} title="查閱位置" description="從房間、櫃位到箱子逐層瀏覽" tone="amber" />
        </div>
      </section>

      {!loadError ? <section className="page-section order-4" aria-labelledby="recent-items-heading">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">最近更新</p>
            <h2 id="recent-items-heading" className="mt-1 text-xl font-bold text-slate-900">最近物品</h2>
          </div>
          {recent.length > 0 ? <ActionLink href={toHref('/search')} variant="ghost" size="md">查看全部</ActionLink> : null}
        </div>
        {loading ? <div className="mt-4"><LoadingState label="正在載入最近物品…" rows={2} /></div> : <ul className="mt-4 grid gap-3 md:grid-cols-2 md:gap-4">
          {recent.map(({ item, locationPath }) => <li key={item.id}><ItemCard item={item} locationPath={locationPath} /></li>)}
        </ul>}
        {!loading && recent.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-teal-200 bg-teal-50/70 p-6 text-center">
            <Package aria-hidden="true" className="mx-auto h-8 w-8 text-teal-600" />
            <p className="mt-3 font-semibold text-slate-900">目前沒有本機物品</p>
            <p className="mt-1 text-sm text-slate-600">從第一件物品開始建立你的家庭收納地圖。</p>
            <ActionLink href={toHref('/add')} variant="primary" size="md" leadingIcon={<Plus aria-hidden="true" className="h-4 w-4" />} className="mt-4">新增第一件物品</ActionLink>
          </div>
        ) : null}
      </section> : null}
    </div>
  );
}
