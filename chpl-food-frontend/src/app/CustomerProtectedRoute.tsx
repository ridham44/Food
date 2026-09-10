import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';

export function CustomerProtectedRoute({ children }: { children: ReactNode }) {
  const accessToken = useCustomerAuthStore((state) => state.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/app/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
