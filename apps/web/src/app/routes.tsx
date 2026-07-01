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
  { id: 'home', path: '/', label: '首頁', icon: Home, showInBottomNav: true },
  { id: 'locations', path: '/locations', label: '位置', icon: Map, showInBottomNav: true },
  { id: 'add', path: '/add', label: '新增', icon: PlusCircle, showInBottomNav: true },
  { id: 'search', path: '/search', label: '搜尋', icon: Search, showInBottomNav: true },
  { id: 'settings', path: '/settings', label: '設定', icon: Settings, showInBottomNav: true },
  { id: 'item-detail', path: '/items/:itemId', label: '物品詳情', icon: Archive, showInBottomNav: false }
];

export const bottomNavRoutes = appRoutes.filter((route) => route.showInBottomNav);
