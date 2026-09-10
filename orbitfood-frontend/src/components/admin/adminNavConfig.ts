import { LayoutDashboard, Building2, BarChart3, History, Settings, type LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Restaurants', path: '/admin/tenants', icon: Building2 },
  { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
  { label: 'Activity Log', path: '/admin/activity-log', icon: History },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

/** Longest-prefix match against the current pathname, for the Topbar title. */
export function findActiveAdminNavItem(pathname: string): AdminNavItem | undefined {
  const exact = ADMIN_NAV_ITEMS.find((item) => item.path === pathname);
  if (exact) return exact;
  return ADMIN_NAV_ITEMS.filter((item) => item.path !== '/admin' && pathname.startsWith(item.path)).sort(
    (a, b) => b.path.length - a.path.length
  )[0];
}
