import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, ClipboardList, UserCircle, Store, LogOut } from 'lucide-react';
import { BrandMark } from '@/features/auth/components/BrandMark';
import { cn } from '@/lib/cn';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';
import { useCartCount } from '@/features/cart/cartStore';
import { AlicaWidget } from '@/features/aiAssistant/AlicaWidget';
import { customerApiClient } from '@/services/api/customerClient';

const NAV_ITEMS = [
  { label: 'Restaurants', path: '/app/restaurants', icon: Store },
  { label: 'My orders', path: '/app/orders', icon: ClipboardList },
  { label: 'Profile', path: '/app/profile', icon: UserCircle },
];

const ALICA_SUGGESTIONS = ["What's the status of my last order?", 'How many loyalty points do I have?', 'Show my available coupons'];

export default function CustomerLayout() {
  const customer = useCustomerAuthStore((state) => state.customer);
  const logout = useCustomerAuthStore((state) => state.logout);
  const cartCount = useCartCount();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/app/login');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg-base">
      <header className="glass-panel sticky top-0 z-30 border-b border-border-subtle">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-4 px-4 sm:px-6">
          <NavLink to="/app/restaurants" className="flex items-center gap-2 shrink-0">
            <BrandMark className="h-10 w-12" />
          </NavLink>

          <nav className="hidden flex-1 items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-control px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-text-primary'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <NavLink
              to="/app/cart"
              className={({ isActive }) =>
                cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary',
                  isActive && 'bg-surface-hover text-text-primary'
                )
              }
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </NavLink>

            {customer && (
              <button
                type="button"
                onClick={handleLogout}
                className="hidden h-10 w-10 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-danger/12 hover:text-danger sm:flex"
                aria-label="Sign out"
              >
                <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-6 sm:pb-6">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="glass-panel--strong fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border-subtle py-2 sm:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 rounded-control px-4 py-1.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary-hover' : 'text-text-muted'
              )
            }
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <AlicaWidget
        apiClient={customerApiClient}
        endpoint="/ask-customer-ai"
        greeting="Hi, I'm Alica. Ask me about your orders, points, or coupons."
        suggestions={ALICA_SUGGESTIONS}
        variant="mobile-tab-bar"
      />
    </div>
  );
}
