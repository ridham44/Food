import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { AdminSidebar, useAdminSidebarWidth } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { AlicaWidget } from '@/features/aiAssistant/AlicaWidget';
import { apiClient } from '@/services/api/client';

const ALICA_SUGGESTIONS = [
  'How many tenants are pending approval?',
  "What's this month's platform activity?",
  'List the most recently registered tenants',
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sidebarWidth = useAdminSidebarWidth(collapsed);

  return (
    <div className="flex min-h-screen w-full bg-bg-base">
      <aside
        className="glass-panel sticky top-0 hidden h-screen shrink-0 self-start border-r border-border-subtle transition-[width] duration-200 ease-out lg:block"
        style={{ width: sidebarWidth }}
      >
        <AdminSidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
      </aside>

      <Dialog.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm lg:hidden" />
          <Dialog.Content
            className="glass-panel--strong fixed inset-y-0 left-0 z-modal w-72 max-w-[85vw] border-r border-border-subtle outline-none lg:hidden"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <AdminSidebar collapsed={false} onToggleCollapsed={() => setMobileNavOpen(false)} onNavigate={() => setMobileNavOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>

      <AlicaWidget
        apiClient={apiClient}
        endpoint="/ask-admin-ai"
        greeting="Hi, I'm Alica. Ask me anything about tenants, users, or platform activity."
        suggestions={ALICA_SUGGESTIONS}
      />
    </div>
  );
}
