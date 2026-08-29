import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import DashboardLayout from '@/app/DashboardLayout';
import { ProtectedRoute } from '@/app/ProtectedRoute';
import CustomerLayout from '@/app/CustomerLayout';
import { CustomerProtectedRoute } from '@/app/CustomerProtectedRoute';
import AdminLayout from '@/app/AdminLayout';
import { AdminProtectedRoute } from '@/app/AdminProtectedRoute';
import { RouteLoadingFallback } from '@/components/RouteLoadingFallback';

// Every page is loaded on demand (its own JS chunk) instead of one bundle —
// a visitor to /login was otherwise downloading the admin, tenant, and
// customer portals' code before seeing the sign-in form.
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const CustomerLoginPage = lazy(() => import('@/features/customerAuth/CustomerLoginPage'));
const CustomerSignupPage = lazy(() => import('@/features/customerAuth/CustomerSignupPage'));
const RestaurantsPage = lazy(() => import('@/pages/customer/RestaurantsPage'));
const RestaurantDetailPage = lazy(() => import('@/pages/customer/RestaurantDetailPage'));
const CartPage = lazy(() => import('@/pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/customer/CheckoutPage'));
const CustomerOrdersPage = lazy(() => import('@/pages/customer/OrdersPage'));
const CustomerOrderDetailPage = lazy(() => import('@/pages/customer/OrderDetailPage'));
const CustomerMyProfilePage = lazy(() => import('@/pages/customer/ProfilePage'));
const DashboardHome = lazy(() => import('@/pages/restaurant/DashboardHome'));
const OrdersPage = lazy(() => import('@/pages/restaurant/OrdersPage'));
const KitchenPage = lazy(() => import('@/pages/restaurant/KitchenPage'));
const MenuPage = lazy(() => import('@/pages/restaurant/MenuPage'));
const CategoriesPage = lazy(() => import('@/pages/restaurant/CategoriesPage'));
const InventoryPage = lazy(() => import('@/pages/restaurant/InventoryPage'));
const TablesPage = lazy(() => import('@/pages/restaurant/TablesPage'));
const CustomersPage = lazy(() => import('@/pages/restaurant/CustomersPage'));
const CustomerProfilePage = lazy(() => import('@/pages/restaurant/CustomerProfilePage'));
const StaffPage = lazy(() => import('@/pages/restaurant/StaffPage'));
const PaymentsPage = lazy(() => import('@/pages/restaurant/PaymentsPage'));
const ReportsPage = lazy(() => import('@/pages/restaurant/ReportsPage'));
const RestaurantSettingsPage = lazy(() => import('@/pages/restaurant/RestaurantSettingsPage'));
const ProfileSettingsPage = lazy(() => import('@/pages/restaurant/ProfileSettingsPage'));
const CouponsPage = lazy(() => import('@/pages/restaurant/CouponsPage'));
const CombosPage = lazy(() => import('@/pages/restaurant/CombosPage'));
const ExpensesPage = lazy(() => import('@/pages/restaurant/ExpensesPage'));
const VendorsPage = lazy(() => import('@/pages/restaurant/VendorsPage'));
const ActivityLogPage = lazy(() => import('@/pages/restaurant/ActivityLogPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminTenantsPage = lazy(() => import('@/pages/admin/TenantsPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));

const withFallback = (element: ReactNode) => <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>;

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withFallback(<LoginPage />),
  },
  {
    path: '/app/login',
    element: withFallback(<CustomerLoginPage />),
  },
  {
    path: '/app/signup',
    element: withFallback(<CustomerSignupPage />),
  },
  {
    path: '/app',
    element: (
      <CustomerProtectedRoute>
        <CustomerLayout />
      </CustomerProtectedRoute>
    ),
    children: [
      { index: true, element: withFallback(<RestaurantsPage />) },
      { path: 'restaurants', element: withFallback(<RestaurantsPage />) },
      { path: 'restaurants/:tenantId', element: withFallback(<RestaurantDetailPage />) },
      { path: 'cart', element: withFallback(<CartPage />) },
      { path: 'checkout', element: withFallback(<CheckoutPage />) },
      { path: 'orders', element: withFallback(<CustomerOrdersPage />) },
      { path: 'orders/:id', element: withFallback(<CustomerOrderDetailPage />) },
      { path: 'profile', element: withFallback(<CustomerMyProfilePage />) },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withFallback(<DashboardHome />) },
      { path: 'orders', element: withFallback(<OrdersPage />) },
      { path: 'kitchen', element: withFallback(<KitchenPage />) },
      { path: 'menu', element: withFallback(<MenuPage />) },
      { path: 'categories', element: withFallback(<CategoriesPage />) },
      { path: 'combos', element: withFallback(<CombosPage />) },
      { path: 'inventory', element: withFallback(<InventoryPage />) },
      { path: 'tables', element: withFallback(<TablesPage />) },
      { path: 'customers', element: withFallback(<CustomersPage />) },
      { path: 'customers/:id', element: withFallback(<CustomerProfilePage />) },
      { path: 'staff', element: withFallback(<StaffPage />) },
      { path: 'vendors', element: withFallback(<VendorsPage />) },
      { path: 'expenses', element: withFallback(<ExpensesPage />) },
      { path: 'coupons', element: withFallback(<CouponsPage />) },
      { path: 'payments', element: withFallback(<PaymentsPage />) },
      { path: 'reports', element: withFallback(<ReportsPage />) },
      { path: 'settings/restaurant', element: withFallback(<RestaurantSettingsPage />) },
      { path: 'settings/activity-log', element: withFallback(<ActivityLogPage />) },
      { path: 'settings/profile', element: withFallback(<ProfileSettingsPage />) },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminProtectedRoute>
        <AdminLayout />
      </AdminProtectedRoute>
    ),
    children: [
      { index: true, element: withFallback(<AdminDashboardPage />) },
      { path: 'tenants', element: withFallback(<AdminTenantsPage />) },
      { path: 'reports', element: withFallback(<AdminReportsPage />) },
      { path: 'activity-log', element: withFallback(<ActivityLogPage />) },
      { path: 'settings', element: withFallback(<AdminSettingsPage />) },
    ],
  },
]);
