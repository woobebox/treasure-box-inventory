import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AddItemPage } from '../features/items/AddItemPage';
import { ItemDetailPage } from '../features/items/ItemDetailPage';
import { HomePage } from '../features/home/HomePage';
import { StorageSettings } from '../features/settings/StorageSettings';
import { SyncSettings } from '../features/settings/SyncSettings';
import { OptionSettings } from '../features/settings/OptionSettings';
import { HouseholdSettingsPage } from '../features/households/HouseholdSettingsPage';
import { BackupSettings } from '../features/settings/BackupSettings';
import { TrashSettings } from '../features/settings/TrashSettings';
import { TrashPage } from '../features/settings/TrashPage';
import { LocationsPage } from '../features/locations/LocationsPage';
import { LocationDetailPage } from '../features/locations/LocationDetailPage';
import { SearchPage } from '../features/search/SearchPage';
import { bottomNavRoutes } from './routes';
import { toHref, toLogicalPath } from './basePath';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../services/authContext';
import { useHousehold } from '../services/householdContextValue';
import { useAutoSync } from '../sync/useSyncStatus';
import { LoginPage } from '../features/auth/LoginPage';
import { HouseholdOnboarding } from '../features/households/HouseholdOnboarding';

const pageCopy: Record<string, { title: string; description: string }> = {
  '/': { title: '收納寶盒', description: '離線優先的家庭照片庫存儀表板。' },
  '/locations': { title: '位置管理', description: '管理房間、櫃位、抽屜、掛勾與箱子。' },
  '/add': { title: '新增物品', description: '拍攝或上傳照片，先安全儲存在本機。' },
  '/search': { title: '搜尋物品', description: '依名稱、標籤、分類、位置、日期或狀態找回物品。' },
  '/settings': { title: '系統設定', description: '管理同步、儲存空間、備份、家庭與安裝狀態。' },
  '/trash': { title: '已刪除物品', description: '30 天內可還原，逾期永久移除。' }
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
  const isTopLevel = bottomNavRoutes.some((route) => route.path === path);
  const page = pageCopy[path] ?? (path.startsWith('/locations/')
    ? { title: '位置詳情', description: '查看此位置與子位置內的物品。' }
    : { title: '物品詳情', description: '查看物品資料、目前位置、照片與移動歷史。' });

  function completeNavigation(nextPath: string): void {
    setPath(nextPath);
    window.scrollTo({ top: 0 });
  }

  // Logical path state stays pathname-only; the query string only rides along
  // in the address bar so target pages can read it on mount.
  function navigate(nextPath: string, search = ''): void {
    if (nextPath === path && !search) return;
    window.history.pushState({}, '', toHref(nextPath) + search);
    inAppNavCount.current += 1;
    completeNavigation(nextPath);
  }

  function handleBack(): void {
    if (inAppNavCount.current > 0) window.history.back();
    else navigate(fallbackParentPath(path));
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
      completeNavigation(toLogicalPath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div onClickCapture={handleInternalLink} className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50 shadow-xl">
      <header className="sticky top-0 z-30 bg-teal-700 px-4 py-3 text-white shadow-sm">
        <div className="flex items-center gap-1">
          {!isTopLevel ? (
            <button type="button" aria-label="返回" onClick={handleBack} className="-my-2 -ml-3 flex h-11 w-11 items-center justify-center rounded-xl text-white/90 hover:bg-teal-600">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <h1 className="text-lg font-semibold">{page.title}</h1>
        </div>
      </header>
      <main className="flex-1 px-4 py-5 pb-24">
        <section className="rounded-3xl border border-teal-100 bg-white p-5 shadow-sm">
          <div key={path} className="page-content-enter">
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
                <div className="space-y-6"><StorageSettings /><OptionSettings /><SyncSettings /><BackupSettings /><TrashSettings /><HouseholdSettingsPage /></div>
              ) : path === '/trash' ? (
                <TrashPage />
              ) : path.startsWith('/items/') ? (
                <ItemDetailPage itemId={decodeURIComponent(path.split('/').pop() ?? '')} />
              ) : (
                <>
                  <h2 className="font-semibold text-slate-900">功能殼層已就緒</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">本地 IndexedDB、照片處理、同步與家庭權限相關路由已依 Spec Kit 任務規劃接上。</p>
                </>
              )}
          </div>
        </section>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-md grid-cols-5 border-t border-slate-200 bg-white px-2 pb-[calc(0.25rem+env(safe-area-inset-bottom))] pt-1 shadow-[0_-2px_8px_rgb(15_23_42/0.06)]">
        {bottomNavRoutes.map((route) => {
          const Icon = route.icon;
          const active = route.path === path;
          return (
            <a key={route.id} href={toHref(route.path)} className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[11px] ${active ? 'bg-teal-50 text-teal-800' : 'text-slate-500'}`}>
              <Icon className="h-5 w-5" />
              <span>{route.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
