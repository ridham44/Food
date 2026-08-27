import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '@/features/auth/LoginPage';
import DashboardLayout from '@/app/DashboardLayout';
import { ProtectedRoute } from '@/app/ProtectedRoute';
import DashboardHome from '@/pages/restaurant/DashboardHome';
import OrdersPage from '@/pages/restaurant/OrdersPage';
import KitchenPage from '@/pages/restaurant/KitchenPage';
import MenuPage from '@/pages/restaurant/MenuPage';
import CategoriesPage from '@/pages/restaurant/CategoriesPage';
import InventoryPage from '@/pages/restaurant/InventoryPage';
import TablesPage from '@/pages/restaurant/TablesPage';
import CustomersPage from '@/pages/restaurant/CustomersPage';
import CustomerProfilePage from '@/pages/restaurant/CustomerProfilePage';
import StaffPage from '@/pages/restaurant/StaffPage';
import PaymentsPage from '@/pages/restaurant/PaymentsPage';
import ReportsPage from '@/pages/restaurant/ReportsPage';
import RestaurantSettingsPage from '@/pages/restaurant/RestaurantSettingsPage';
import ProfileSettingsPage from '@/pages/restaurant/ProfileSettingsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'kitchen', element: <KitchenPage /> },
      { path: 'menu', element: <MenuPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'tables', element: <TablesPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:id', element: <CustomerProfilePage /> },
      { path: 'staff', element: <StaffPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings/restaurant', element: <RestaurantSettingsPage /> },
      { path: 'settings/profile', element: <ProfileSettingsPage /> },
    ],
  },
]);
