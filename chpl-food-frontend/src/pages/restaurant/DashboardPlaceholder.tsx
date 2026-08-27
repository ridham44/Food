import { LogOut } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Button } from '@/components/ui/Button/Button';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPlaceholder() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-10">
      <GlassPanel radius="card" className="p-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome{user?.email ? `, ${user.email}` : ''}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          You're signed in. The dashboard, menu, orders, and reporting screens land next — this
          page confirms the login flow end-to-end.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs text-text-muted">
          <span className="rounded-control border border-border-subtle bg-surface-glass px-3 py-1.5">
            Role: {user?.role ?? 'n/a'}
          </span>
          <span className="rounded-control border border-border-subtle bg-surface-glass px-3 py-1.5">
            Tenant: {user?.tenant ?? 'n/a'}
          </span>
        </div>
        <Button variant="secondary" className="mt-8" onClick={logout}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </Button>
      </GlassPanel>
    </div>
  );
}
