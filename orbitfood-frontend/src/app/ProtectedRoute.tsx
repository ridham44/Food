import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const roleType = useAuthStore((state) => state.user?.roleType);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login/business" replace state={{ from: location.pathname }} />;
  }

  // Platform admins don't have a restaurant of their own to manage — send
  // them to the admin portal instead of a tenant dashboard.
  if (roleType === '1') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
