import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, LogOut, Circle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import { SidebarLogo } from '@/components/dashboard/SidebarLogo';
import { NAV_SECTIONS } from '@/components/dashboard/navConfig';
import { Tooltip } from '@/components/ui/Tooltip/Tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, onNavigate }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center gap-2.5 px-4 py-4', collapsed && 'justify-center px-2')}>
        <SidebarLogo collapsed={collapsed} />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-text-primary">OrbitFood</p>
            <p className="truncate text-[11px] text-text-muted">Food Ordering. Simplified.</p>
          </div>
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
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4 last:mb-0">
            {!collapsed && (
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {section.title}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const link = (
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
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
                return (
                  <li key={item.path}>{collapsed ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link}</li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="h-px shrink-0 bg-border-subtle" />

      <div className={cn('flex items-center gap-2.5 px-3 py-3.5', collapsed && 'justify-center px-2')}>
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-gradient-to-br from-primary/25 to-cyan/10 text-sm font-semibold text-text-primary">
          {(user?.email ?? 'U').charAt(0).toUpperCase()}
          <Circle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 fill-success text-success" strokeWidth={0} />
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-text-primary">{user?.tenant ?? 'Your restaurant'}</p>
            <p className="truncate text-[11px] text-text-muted">{user?.email ?? user?.mobile ?? 'Manager'}</p>
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

export function useSidebarWidth(collapsed: boolean) {
  return collapsed ? 76 : 256;
}
