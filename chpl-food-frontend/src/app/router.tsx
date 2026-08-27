import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '@/features/auth/LoginPage';
import DashboardPlaceholder from '@/pages/restaurant/DashboardPlaceholder';
import { ProtectedRoute } from '@/app/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardPlaceholder />
      </ProtectedRoute>
    ),
  },
]);
