import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const roleType = useAuthStore((state) => state.user?.roleType);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // A logged-in tenant/staff user has no business in the admin portal —
  // send them back to their own dashboard rather than showing a 403 page.
  if (roleType !== '1') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
