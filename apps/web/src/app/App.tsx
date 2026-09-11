import { lazy, Suspense, type MouseEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { bottomNavRoutes } from './routes';
import { toHref, toLogicalPath } from './basePath';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../services/authContext';
import { useHousehold } from '../services/householdContextValue';
import { useAutoSync } from '../sync/useSyncStatus';
import { LoginPage } from '../features/auth/LoginPage';
import { HouseholdOnboarding } from '../features/households/HouseholdOnboarding';
import { requestAppNavigation } from './navigationRequest';

const AddItemPage = lazy(() => import('../features/items/AddItemPage').then((module) => ({ default: module.AddItemPage })));
const ItemDetailPage = lazy(() => import('../features/items/ItemDetailPage').then((module) => ({ default: module.ItemDetailPage })));
const HomePage = lazy(() => import('../features/home/HomePage').then((module) => ({ default: module.HomePage })));
const StorageSettings = lazy(() => import('../features/settings/StorageSettings').then((module) => ({ default: module.StorageSettings })));
const SyncSettings = lazy(() => import('../features/settings/SyncSettings').then((module) => ({ default: module.SyncSettings })));
const OptionSettings = lazy(() => import('../features/settings/OptionSettings').then((module) => ({ default: module.OptionSettings })));
const HouseholdSettingsPage = lazy(() => import('../features/households/HouseholdSettingsPage').then((module) => ({ default: module.HouseholdSettingsPage })));
const BackupSettings = lazy(() => import('../features/settings/BackupSettings').then((module) => ({ default: module.BackupSettings })));
const TrashSettings = lazy(() => import('../features/settings/TrashSettings').then((module) => ({ default: module.TrashSettings })));
const TrashPage = lazy(() => import('../features/settings/TrashPage').then((module) => ({ default: module.TrashPage })));
const LocationsPage = lazy(() => import('../features/locations/LocationsPage').then((module) => ({ default: module.LocationsPage })));
const LocationDetailPage = lazy(() => import('../features/locations/LocationDetailPage').then((module) => ({ default: module.LocationDetailPage })));
const SearchPage = lazy(() => import('../features/search/SearchPage').then((module) => ({ default: module.SearchPage })));
const UiPreviewPage = lazy(() => import('../features/dev/UiPreviewPage').then((module) => ({ default: module.UiPreviewPage })));

const pageCopy: Record<string, { title: string; description: string }> = {
  '/': { title: '收納寶盒', description: '離線優先的家庭照片庫存儀表板。' },
  '/locations': { title: '位置管理', description: '管理房間、櫃位、抽屜、掛勾與箱子。' },
  '/add': { title: '新增物品', description: '拍攝或上傳照片，先安全儲存在本機。' },
  '/search': { title: '搜尋物品', description: '依名稱、標籤、分類、位置、日期或狀態找回物品。' },
  '/settings': { title: '系統設定', description: '管理同步、儲存空間、備份、家庭與安裝狀態。' },
  '/trash': { title: '已刪除物品', description: '30 天內可還原，逾期永久移除。' },
  '/ui-preview': { title: '介面元件預覽', description: '集中比較共用控制、欄位與狀態。' }
};

// Gate: when Supabase is configured, require a signed-in user and a selected
// household before rendering the app shell. In pure-offline mode (no Supabase)
// this passes straight through to AppShell using the demo household.
export function App() {
  const { user, isLoading } = useAuth();
  const household = useHousehold();
  if (supabase) {
    if (isLoading) return <CenteredNotice text="載入中…" />;
    if (!user) return <LoginPage />;
    if (!household.isReady) return <CenteredNotice text="載入家庭資料…" />;
    if (!household.householdId) return <HouseholdOnboarding />;
  }
  return <AppShell />;
}

function CenteredNotice({ text }: { text: string }) {
  return <main className="flex min-h-dvh items-center justify-center p-6 text-sm text-slate-600">{text}</main>;
}

// Default parent page when a non-top-level route was opened without in-app
// history (deep link / standalone cold start).
function fallbackParentPath(path: string): string {
  if (path.startsWith('/locations/')) return '/locations';
  if (path === '/trash') return '/settings';
  return '/';
}

function AppShell() {
  useAutoSync();
  const [path, setPath] = useState(() => toLogicalPath(window.location.pathname));
  // Counts in-app navigations so the back button knows whether history.back()
  // stays inside the app; deliberately not tracked across sessions.
  const inAppNavCount = useRef(0);
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(path);
  const isTopLevel = bottomNavRoutes.some((route) => route.path === path);
  const page = pageCopy[path] ?? (path.startsWith('/locations/')
    ? { title: '位置詳情', description: '查看此位置與子位置內的物品。' }
    : { title: '物品詳情', description: '查看物品資料、目前位置、照片與移動歷史。' });

  function completeNavigation(nextPath: string, resetScroll = true): void {
    setPath(nextPath);
    if (resetScroll) window.scrollTo({ top: 0 });
  }

  // Logical path state stays pathname-only; the query string only rides along
  // in the address bar so target pages can read it on mount.
  function performNavigation(nextPath: string, search = ''): void {
    if (nextPath === path && !search) return;
    window.history.replaceState({ ...(window.history.state ?? {}), scrollY: window.scrollY }, '', window.location.href);
    window.history.pushState({ scrollY: 0, fromPath: path, fromSearch: window.location.search }, '', toHref(nextPath) + search);
    inAppNavCount.current += 1;
    completeNavigation(nextPath);
  }

  function navigate(nextPath: string, search = ''): void {
    requestAppNavigation(() => performNavigation(nextPath, search));
  }

  function handleBack(): void {
    requestAppNavigation(() => {
      if (inAppNavCount.current > 0) window.history.back();
      else performNavigation(fallbackParentPath(path));
    });
  }

  function handleInternalLink(event: MouseEvent<HTMLDivElement>): void {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!(target instanceof HTMLAnchorElement) || target.target || target.hasAttribute('download')) return;
    const url = new URL(target.href);
    if (url.origin !== window.location.origin) return;
    event.preventDefault();
    navigate(toLogicalPath(url.pathname), url.search);
  }

  useEffect(() => {
    const onPopState = () => {
      inAppNavCount.current = Math.max(0, inAppNavCount.current - 1);
      completeNavigation(toLogicalPath(window.location.pathname), false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (previousPath.current === path) return;
    previousPath.current = path;
    mainRef.current?.focus({ preventScroll: true });
  }, [path]);

  return (
    <div onClickCapture={handleInternalLink} className="app-shell mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col md:grid md:grid-cols-[7rem_minmax(0,1fr)] md:grid-rows-[auto_minmax(0,1fr)] xl:grid-cols-[8rem_minmax(0,1fr)]">
      <a href="#main-content" className="skip-link" onClick={() => window.requestAnimationFrame(() => mainRef.current?.focus())}>跳至主要內容</a>
      <aside className="hidden border-r border-teal-100 bg-white/85 md:sticky md:top-0 md:row-span-2 md:flex md:h-dvh md:flex-col md:px-3 md:py-5">
        <a href={toHref('/')} className="mb-7 flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center text-teal-900 transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-lg font-bold text-white shadow-sm">寶</span>
          <span className="text-xs font-bold leading-4">收納寶盒</span>
        </a>
        <nav aria-label="主要導覽" className="flex flex-1 flex-col gap-2">
          {bottomNavRoutes.map((route) => {
            const Icon = route.icon;
            const active = route.path === path;
            return (
              <a key={route.id} href={toHref(route.path)} aria-current={active ? 'page' : undefined} className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${active ? 'bg-teal-100 text-teal-900 shadow-sm before:absolute before:-left-3 before:h-7 before:w-1 before:rounded-r-full before:bg-teal-700' : 'text-slate-600 hover:bg-teal-50 hover:text-teal-800'}`}>
                <Icon className="h-5 w-5" />
                <span>{route.label}</span>
              </a>
            );
          })}
        </nav>
        <p className="px-1 text-center text-xs leading-4 text-slate-600">離線優先<br />家庭庫存</p>
      </aside>
      <header className="sticky top-0 z-30 border-b border-teal-100 bg-teal-700 px-4 py-3 text-white shadow-sm md:col-start-2 md:px-8 md:py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-1">
          {!isTopLevel ? (
            <button type="button" aria-label="返回" onClick={handleBack} className="-my-2 -ml-3 flex h-12 w-12 items-center justify-center rounded-2xl text-white/90 transition-colors hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-700">
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </button>
          ) : null}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100">家庭庫存控制台</p>
            <h1 className="text-lg font-bold md:text-xl">{page.title}</h1>
            <p className="mt-0.5 hidden text-xs leading-5 text-teal-50/90 md:block">{page.description}</p>
          </div>
        </div>
      </header>
      <main ref={mainRef} id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 py-5 pb-28 outline-none md:col-start-2 md:px-8 md:py-7 md:pb-10">
        <Suspense fallback={<div className="page-section" role="status">正在開啟頁面…</div>}><div key={path} className="page-content-enter min-w-0">
          {path === '/' ? (
            <HomePage />
          ) : path === '/add' ? (
            <AddItemPage />
          ) : path === '/locations' ? (
            <LocationsPage />
          ) : path.startsWith('/locations/') ? (
            <LocationDetailPage locationId={decodeURIComponent(path.split('/').pop() ?? '')} />
          ) : path === '/search' ? (
            <SearchPage />
          ) : path === '/settings' ? (
            <div className="space-y-7">
              <section aria-labelledby="device-settings-heading"><h2 id="device-settings-heading" className="mb-3 text-lg font-bold text-slate-900">裝置與同步</h2><div className="tablet-page-grid"><StorageSettings /><SyncSettings /></div></section>
              <section aria-labelledby="inventory-settings-heading"><h2 id="inventory-settings-heading" className="mb-3 text-lg font-bold text-slate-900">收納選項</h2><OptionSettings /></section>
              <section aria-labelledby="data-settings-heading"><h2 id="data-settings-heading" className="mb-3 text-lg font-bold text-slate-900">資料管理</h2><div className="tablet-page-grid"><BackupSettings /><TrashSettings /></div></section>
              <HouseholdSettingsPage />
            </div>
          ) : path === '/trash' ? (
            <TrashPage />
          ) : path.startsWith('/items/') ? (
            <ItemDetailPage itemId={decodeURIComponent(path.split('/').pop() ?? '')} />
          ) : import.meta.env.DEV && path === '/ui-preview' ? (
            <UiPreviewPage />
          ) : (
            <div className="page-surface p-6"><h2 className="font-semibold text-slate-900">功能殼層已就緒</h2><p className="mt-2 text-sm leading-6 text-slate-600">本地 IndexedDB、照片處理、同步與家庭權限相關路由已依 Spec Kit 任務規劃接上。</p></div>
          )}
        </div></Suspense>
      </main>
      <nav aria-label="手機主要導覽" className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-teal-100 bg-white/95 px-2 pt-2 shadow-[0_-8px_24px_rgb(15_118_110/0.1)] backdrop-blur md:hidden">
        {bottomNavRoutes.map((route) => {
          const Icon = route.icon;
          const active = route.path === path;
          return (
            <a key={route.id} href={toHref(route.path)} aria-current={active ? 'page' : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 text-[11px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset active:bg-teal-100 ${active ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-teal-50'}`}>
              <Icon className="h-5 w-5" />
              <span>{route.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
