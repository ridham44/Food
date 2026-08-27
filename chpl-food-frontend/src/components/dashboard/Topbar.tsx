import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { findActiveNavItem } from '@/components/dashboard/navConfig';
import { useAuthStore } from '@/stores/authStore';
import { useCurrentTenant, useUpdateTenant, getTenantErrorMessage } from '@/features/tenant/useTenant';
import { Switch } from '@/components/ui/Switch/Switch';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu/DropdownMenu';

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { data: tenant } = useCurrentTenant();
  const updateTenant = useUpdateTenant(tenant?.id);

  const activeItem = findActiveNavItem(location.pathname);

  const handleToggleOpen = (checked: boolean) => {
    updateTenant.mutate(
      { isOpen: checked },
      {
        onSuccess: () => toast.success(checked ? 'Restaurant marked as open' : 'Restaurant marked as closed'),
        onError: (error) => toast.error(getTenantErrorMessage(error)),
      }
    );
  };

  return (
    <header className="sticky top-0 z-sticky flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle bg-bg-base/80 px-4 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-base font-bold text-text-primary sm:text-lg">{activeItem?.label ?? 'Dashboard'}</h1>
        {tenant && (
          <div className="mt-0.5 hidden items-center gap-1.5 text-xs text-text-muted sm:flex">
            <span className="truncate">{tenant.companyName}</span>
            <span className="text-border-active">·</span>
            <span className={tenant.isOpen ? 'text-success' : 'text-danger'}>● {tenant.isOpen ? 'Open' : 'Closed'}</span>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {tenant && (
          <div className="hidden items-center gap-2 rounded-control border border-border-subtle bg-surface-glass px-3 py-1.5 md:flex">
            <span className="text-xs font-medium text-text-secondary">{tenant.isOpen ? 'Open' : 'Closed'}</span>
            <Switch checked={tenant.isOpen} onChange={(e) => handleToggleOpen(e.target.checked)} disabled={updateTenant.isPending} />
          </div>
        )}

        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search…"
            className="h-9 w-52 rounded-control border border-border-subtle bg-input-bg pl-9 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15 lg:w-64"
          />
        </div>

        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          aria-label="Notifications"
        >
          <Bell style={{ height: 18, width: 18 }} aria-hidden="true" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex items-center gap-1.5 rounded-control py-1 pl-1 pr-1.5 transition-colors hover:bg-surface-hover">
              <span className="flex h-8 w-8 items-center justify-center rounded-control bg-gradient-to-br from-primary/25 to-cyan/10 text-sm font-semibold text-text-primary">
                {(user?.email ?? 'U').charAt(0).toUpperCase()}
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-text-muted sm:block" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="px-2.5 py-1.5">
              <p className="truncate text-sm font-medium text-text-primary">{user?.email ?? user?.mobile}</p>
              <p className="truncate text-xs text-text-muted">{user?.role ?? 'Team member'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/settings/profile')}>
              <User className="h-4 w-4" aria-hidden="true" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/settings/restaurant')}>
              <Settings className="h-4 w-4" aria-hidden="true" />
              Restaurant settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={logout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
