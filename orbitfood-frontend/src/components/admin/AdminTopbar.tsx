import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, LogOut } from 'lucide-react';
import { findActiveAdminNavItem } from '@/components/admin/adminNavConfig';
import { useAuthStore } from '@/stores/authStore';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu/DropdownMenu';

export function AdminTopbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const activeItem = findActiveAdminNavItem(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
        <h1 className="truncate text-base font-bold text-text-primary sm:text-lg">{activeItem?.label ?? 'Admin'}</h1>
        <p className="mt-0.5 hidden text-xs text-text-muted sm:block">Platform-wide view across every restaurant</p>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex items-center gap-1.5 rounded-control py-1 pl-1 pr-1.5 transition-colors hover:bg-surface-hover">
              <span className="flex h-8 w-8 items-center justify-center rounded-control bg-gradient-to-br from-primary/25 to-cyan/10 text-sm font-semibold text-text-primary">
                {(user?.email ?? 'A').charAt(0).toUpperCase()}
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-text-muted sm:block" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="px-2.5 py-1.5">
              <p className="truncate text-sm font-medium text-text-primary">{user?.email ?? user?.mobile}</p>
              <p className="truncate text-xs text-text-muted">{user?.role ?? 'Platform Admin'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
