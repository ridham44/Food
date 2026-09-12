import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ShoppingCart,
  ClipboardList,
  UserCircle,
  Store,
  LogOut,
  LayoutGrid,
  MapPin,
  Menu,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { BrandMark } from '@/features/auth/components/BrandMark';
import promoImage from '../../images/good food brighter days card.png';
import { cn } from '@/lib/cn';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';
import { useCartCount } from '@/features/cart/cartStore';
import { AlicaWidget } from '@/features/aiAssistant/AlicaWidget';
import { customerApiClient } from '@/services/api/customerClient';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu/DropdownMenu';

const SIDEBAR_NAV_ITEMS = [
  { label: 'Home', path: '/app', icon: LayoutGrid, end: true },
  { label: 'Restaurants', path: '/app/restaurants', icon: Store },
  { label: 'My Orders', path: '/app/orders', icon: ClipboardList },
  { label: 'Profile', path: '/app/profile', icon: UserCircle },
  { label: 'Addresses', path: '/app/addresses', icon: MapPin },
];

// The bottom tab bar on small screens keeps only the most-frequent actions —
// Addresses is one tap away from Profile there, same as before.
const MOBILE_TAB_ITEMS = SIDEBAR_NAV_ITEMS.slice(0, 4);

const ALICA_SUGGESTIONS = ["What's the status of my last order?", 'How many loyalty points do I have?', 'Show my available coupons'];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <NavLink to="/app" end onClick={onNavigate} className="flex items-center gap-2 px-5 py-5">
        <BrandMark width={44} height={36} />
      </NavLink>

      <nav className="flex flex-col gap-1 px-3">
        {SIDEBAR_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-control border border-transparent px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                isActive
                  ? 'border-border-active bg-gradient-to-r from-primary/25 to-primary/5 text-text-primary shadow-[0_4px_16px_rgba(139,108,255,0.18)]'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-3">
        <div
          className="relative flex h-56 flex-col justify-end overflow-hidden rounded-card bg-cover bg-center p-4"
          style={{ backgroundImage: `url(${promoImage})` }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
          <div className="relative flex flex-col gap-2.5">
            <p className="text-base font-bold leading-tight text-white">
              Good Food
              <br />
              Brighter Days
            </p>
            <Link
              to="/app/restaurants"
              onClick={onNavigate}
              className="inline-flex w-fit items-center gap-1 rounded-control bg-white/95 px-3 py-1.5 text-xs font-semibold text-bg-base transition-colors hover:bg-white"
            >
              Explore Restaurants
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderSearch() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/app/restaurants?q=${encodeURIComponent(q)}` : '/app/restaurants');
  };

  return (
    <form onSubmit={handleSubmit} className="relative hidden max-w-xl flex-1 lg:block">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search restaurants by name…"
        className="h-11 w-full rounded-full border border-border-subtle bg-input-bg pl-10 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
      />
    </form>
  );
}

function IconLink({ to, label, children }: { to: string; label: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex h-10 w-10 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
          isActive && 'bg-surface-hover text-text-primary'
        )
      }
      aria-label={label}
    >
      {children}
    </NavLink>
  );
}

export default function CustomerLayout() {
  const customer = useCustomerAuthStore((state) => state.customer);
  const logout = useCustomerAuthStore((state) => state.logout);
  const cartCount = useCartCount();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // The dashboard has its own inline "Meet Alicia" panel — the floating
  // launcher would otherwise sit directly on top of it (and, on narrow
  // screens, on top of the stat cards behind it).
  const isDashboard = location.pathname === '/app';

  const handleLogout = () => {
    logout();
    navigate('/app/login');
  };

  return (
    <div className="flex min-h-screen w-full bg-bg-base">
      <aside className="glass-panel sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-border-subtle lg:block">
        <SidebarNav />
      </aside>

      <Dialog.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm lg:hidden" />
          <Dialog.Content
            className="glass-panel--strong fixed inset-y-0 left-0 z-modal w-72 max-w-[85vw] overflow-y-auto border-r border-border-subtle outline-none lg:hidden"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-panel sticky top-0 z-30 border-b border-border-subtle">
          <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <NavLink to="/app" end className="flex shrink-0 items-center gap-2 lg:hidden">
              <BrandMark width={40} height={34} />
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="bg-gradient-to-r from-primary to-danger bg-clip-text text-sm font-extrabold text-transparent">
                  OrbitFood
                </span>
                <span className="text-[10px] text-text-muted">Food Ordering. Simplified.</span>
              </span>
            </NavLink>

            <HeaderSearch />

            <div className="ml-auto flex items-center gap-1.5">
              <IconLink to="/app/cart" label="Cart">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </IconLink>

              {customer && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-control py-1 pl-1.5 pr-2 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      <Avatar name={customer.fullName} size="sm" />
                      <span className="hidden flex-col items-start leading-tight sm:flex">
                        <span className="text-sm font-semibold text-text-primary">{customer.fullName.split(' ')[0]}</span>
                        <span className="text-[11px] text-text-muted">View profile</span>
                      </span>
                      <ChevronDown className="hidden h-3.5 w-3.5 text-text-muted sm:block" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => navigate('/app/profile')}>
                      <UserCircle className="h-4 w-4" aria-hidden="true" />
                      View profile
                    </DropdownMenuItem>
                    <DropdownMenuItem destructive onSelect={handleLogout}>
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-6 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="glass-panel--strong fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border-subtle pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
      >
        {MOBILE_TAB_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 rounded-control px-4 py-1.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary-hover' : 'text-text-muted hover:text-text-secondary'
              )
            }
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {!isDashboard && (
        <AlicaWidget
          apiClient={customerApiClient}
          endpoint="/ask-customer-ai"
          greeting="Hi, I'm Alica. Ask me about your orders, points, or coupons."
          suggestions={ALICA_SUGGESTIONS}
          variant="mobile-tab-bar"
        />
      )}
    </div>
  );
}
