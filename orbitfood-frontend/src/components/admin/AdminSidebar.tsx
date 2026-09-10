import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import { SidebarLogo } from '@/components/dashboard/SidebarLogo';
import { ADMIN_NAV_ITEMS } from '@/components/admin/adminNavConfig';
import { Tooltip } from '@/components/ui/Tooltip/Tooltip';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
}

export function AdminSidebar({ collapsed, onToggleCollapsed, onNavigate }: AdminSidebarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center gap-3 px-4 py-3.5', collapsed && 'justify-center px-2')}>
        <SidebarLogo collapsed={collapsed} />
        {!collapsed && (
          <p className="min-w-0 truncate font-[var(--font-display)] text-lg font-bold leading-tight text-text-primary">
            OrbitFood Admin
          </p>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={cn(
            'ml-auto hidden h-7 w-7 shrink-0 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary lg:flex',
            collapsed && 'ml-0'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="h-px shrink-0 bg-border-subtle" />

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        <ul className="flex flex-col gap-0.5">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const link = (
              <NavLink
                to={item.path}
                end={item.path === '/admin'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-text-primary'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
            return <li key={item.path}>{collapsed ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link}</li>;
          })}
        </ul>
      </nav>

      <div className="h-px shrink-0 bg-border-subtle" />

      <div className={cn('flex items-center gap-2.5 px-3 py-3.5', collapsed && 'justify-center px-2')}>
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-gradient-to-br from-primary/25 to-cyan/10 text-sm font-semibold text-text-primary">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-text-primary">Platform Admin</p>
            <p className="truncate text-[11px] text-text-muted">{user?.email ?? user?.mobile ?? 'Admin'}</p>
          </div>
        )}
        {!collapsed && (
          <Tooltip content="Sign out">
            <button
              type="button"
              onClick={logout}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-danger/12 hover:text-danger"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function useAdminSidebarWidth(collapsed: boolean) {
  return collapsed ? 76 : 256;
}
