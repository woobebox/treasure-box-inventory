import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { AddItemPage } from '../features/items/AddItemPage';
import { ItemDetailPage } from '../features/items/ItemDetailPage';
import { HomePage } from '../features/home/HomePage';
import { StorageSettings } from '../features/settings/StorageSettings';
import { SyncSettings } from '../features/settings/SyncSettings';
import { OptionSettings } from '../features/settings/OptionSettings';
import { HouseholdSettingsPage } from '../features/households/HouseholdSettingsPage';
import { BackupSettings } from '../features/settings/BackupSettings';
import { LocationsPage } from '../features/locations/LocationsPage';
import { SearchPage } from '../features/search/SearchPage';
import { bottomNavRoutes } from './routes';
import { toHref, toLogicalPath } from './basePath';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../services/authContext';
import { useHousehold } from '../services/householdContextValue';
import { LoginPage } from '../features/auth/LoginPage';
import { HouseholdOnboarding } from '../features/households/HouseholdOnboarding';

const pageCopy: Record<string, { title: string; description: string }> = {
  '/': { title: '收納寶盒', description: '離線優先的家庭照片庫存儀表板。' },
  '/locations': { title: '位置管理', description: '管理房間、櫃位、抽屜、掛勾與箱子。' },
  '/add': { title: '新增物品', description: '拍攝或上傳照片，先安全儲存在本機。' },
  '/search': { title: '搜尋物品', description: '依名稱、標籤、分類、位置、日期或狀態找回物品。' },
  '/settings': { title: '系統設定', description: '管理同步、儲存空間、備份、家庭與安裝狀態。' }
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

function AppShell() {
  const [path, setPath] = useState(() => toLogicalPath(window.location.pathname));
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const routeTimer = useRef<number | undefined>(undefined);
  const page = pageCopy[path] ?? { title: '物品詳情', description: '查看物品資料、目前位置、照片與移動歷史。' };

  function completeNavigation(nextPath: string): void {
    window.clearTimeout(routeTimer.current);
    setIsRouteLoading(true);
    routeTimer.current = window.setTimeout(() => {
      setPath(nextPath);
      setIsRouteLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 220);
  }

  function navigate(nextPath: string): void {
    if (nextPath === path) return;
    window.history.pushState({}, '', toHref(nextPath));
    completeNavigation(nextPath);
  }

  function handleInternalLink(event: MouseEvent<HTMLDivElement>): void {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!(target instanceof HTMLAnchorElement) || target.target || target.hasAttribute('download')) return;
    const url = new URL(target.href);
    if (url.origin !== window.location.origin) return;
    event.preventDefault();
    navigate(toLogicalPath(url.pathname));
  }

  useEffect(() => {
    const onPopState = () => completeNavigation(toLogicalPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.clearTimeout(routeTimer.current);
    };
  }, []);

  return (
    <div onClickCapture={handleInternalLink} className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50 shadow-xl">
      <header className="sticky top-0 z-30 bg-teal-700 px-4 py-3 text-white shadow-sm">
        <h1 className="text-lg font-semibold">{page.title}</h1>
      </header>
      <main className="flex-1 px-4 py-5 pb-24">
        <section className="rounded-3xl border border-teal-100 bg-white p-5 shadow-sm">
          {isRouteLoading ? (
            <RouteSkeleton />
          ) : (
            <div key={path} className="page-content-enter">
              {path === '/' ? (
                <HomePage />
              ) : path === '/add' ? (
                <AddItemPage />
              ) : path === '/locations' ? (
                <LocationsPage />
              ) : path === '/search' ? (
                <SearchPage />
              ) : path === '/settings' ? (
                <div className="space-y-6"><StorageSettings /><OptionSettings /><SyncSettings /><BackupSettings /><HouseholdSettingsPage /></div>
              ) : path.startsWith('/items/') ? (
                <ItemDetailPage itemId={decodeURIComponent(path.split('/').pop() ?? '')} />
              ) : (
                <>
                  <h2 className="font-semibold text-slate-900">功能殼層已就緒</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">本地 IndexedDB、照片處理、同步與家庭權限相關路由已依 Spec Kit 任務規劃接上。</p>
                </>
              )}
            </div>
          )}
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

function RouteSkeleton() {
  return (
    <div aria-label="頁面載入中" className="space-y-4">
      <div className="skeleton-block h-5 w-2/3" />
      <div className="skeleton-block h-4 w-full" />
      <div className="skeleton-block h-4 w-5/6" />
      <div className="grid gap-3 pt-2">
        <div className="skeleton-block h-20 w-full" />
        <div className="skeleton-block h-16 w-full" />
        <div className="skeleton-block h-16 w-full" />
      </div>
    </div>
  );
}
