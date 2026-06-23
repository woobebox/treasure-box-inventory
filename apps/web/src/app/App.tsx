import { AddItemPage } from '../features/items/AddItemPage';
import { ItemDetailPage } from '../features/items/ItemDetailPage';
import { HomePage } from '../features/home/HomePage';
import { StorageSettings } from '../features/settings/StorageSettings';
import { SyncSettings } from '../features/settings/SyncSettings';
import { HouseholdSettingsPage } from '../features/households/HouseholdSettingsPage';
import { BackupSettings } from '../features/settings/BackupSettings';
import { LocationsPage } from '../features/locations/LocationsPage';
import { SearchPage } from '../features/search/SearchPage';
import { bottomNavRoutes } from './routes';

const pageCopy: Record<string, { title: string; description: string }> = {
  '/': { title: 'Treasure Box', description: 'Offline-first household inventory dashboard.' },
  '/locations': { title: 'Locations', description: 'Browse rooms, cabinets, drawers, hooks, and boxes.' },
  '/add': { title: 'Add Item', description: 'Capture a compressed photo and save an item locally first.' },
  '/search': { title: 'Search', description: 'Find household items by name, tag, category, location, date, or status.' },
  '/settings': { title: 'Settings', description: 'Manage sync, storage, backup, household, and installability.' }
};

export function App() {
  const path = window.location.pathname;
  const page = pageCopy[path] ?? { title: 'Item Detail', description: 'View item metadata, current location, photos, and movement history.' };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50 shadow-xl">
      <header className="bg-teal-700 px-6 pb-8 pt-10 text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-teal-100">Local-first PWA</p>
        <h1 className="mt-3 text-3xl font-bold">{page.title}</h1>
        <p className="mt-2 text-sm text-teal-50">{page.description}</p>
      </header>
      <main className="flex-1 px-4 py-6">
        <section className="rounded-3xl border border-teal-100 bg-white p-5 shadow-sm">
          {path === '/' ? (
            <HomePage />
          ) : path === '/add' ? (
            <AddItemPage />
          ) : path === '/locations' ? (
            <LocationsPage />
          ) : path === '/search' ? (
            <SearchPage />
          ) : path === '/settings' ? (
            <div className="space-y-6"><StorageSettings /><SyncSettings /><BackupSettings /><HouseholdSettingsPage /></div>
          ) : path.startsWith('/items/') ? (
            <ItemDetailPage itemId={decodeURIComponent(path.split('/').pop() ?? '')} />
          ) : (
            <>
              <h2 className="font-semibold text-slate-900">Implementation shell</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Core routes are ready for the local IndexedDB, media, sync, and household features defined in the Spec Kit task plan.</p>
            </>
          )}
        </section>
      </main>
      <nav className="grid grid-cols-5 border-t border-slate-200 bg-white px-2 pb-3 pt-2">
        {bottomNavRoutes.map((route) => {
          const Icon = route.icon;
          const active = route.path === path;
          return (
            <a key={route.id} href={route.path} className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs ${active ? 'bg-teal-50 text-teal-800' : 'text-slate-500'}`}>
              <Icon className="h-5 w-5" />
              <span>{route.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
