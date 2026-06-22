import { Archive, Home, Map, PlusCircle, Search, Settings } from 'lucide-react';
import type { ComponentType } from 'react';

export type AppRouteId = 'home' | 'locations' | 'add' | 'search' | 'settings' | 'item-detail';

export interface AppRoute {
  id: AppRouteId;
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  showInBottomNav: boolean;
}

export const appRoutes: AppRoute[] = [
  { id: 'home', path: '/', label: 'Home', icon: Home, showInBottomNav: true },
  { id: 'locations', path: '/locations', label: 'Locations', icon: Map, showInBottomNav: true },
  { id: 'add', path: '/add', label: 'Add', icon: PlusCircle, showInBottomNav: true },
  { id: 'search', path: '/search', label: 'Search', icon: Search, showInBottomNav: true },
  { id: 'settings', path: '/settings', label: 'Settings', icon: Settings, showInBottomNav: true },
  { id: 'item-detail', path: '/items/:itemId', label: 'Item Detail', icon: Archive, showInBottomNav: false }
];

export const bottomNavRoutes = appRoutes.filter((route) => route.showInBottomNav);
