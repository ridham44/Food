import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Sidebar, useSidebarWidth } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';
import { AlicaWidget } from '@/features/aiAssistant/AlicaWidget';
import { apiClient } from '@/services/api/client';

const ALICA_SUGGESTIONS = [
  "What were today's sales?",
  'Which menu items sold best this week?',
  'Show unpaid bills from last month',
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sidebarWidth = useSidebarWidth(collapsed);

  return (
    <div className="flex min-h-screen w-full bg-bg-base">
      {/* Desktop sidebar — pinned to the viewport height (not stretched to
          match page content, which can grow taller than 100vh) so its own
          nav list scrolls internally instead of the whole sidebar. */}
      <aside
        className="glass-panel sticky top-0 hidden h-screen shrink-0 self-start border-r border-border-subtle transition-[width] duration-200 ease-out lg:block"
        style={{ width: sidebarWidth }}
      >
        <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
      </aside>

      {/* Mobile drawer */}
      <Dialog.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm lg:hidden" />
          <Dialog.Content
            className="glass-panel--strong fixed inset-y-0 left-0 z-modal w-72 max-w-[85vw] border-r border-border-subtle outline-none lg:hidden"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Sidebar collapsed={false} onToggleCollapsed={() => setMobileNavOpen(false)} onNavigate={() => setMobileNavOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>

      <AlicaWidget
        apiClient={apiClient}
        endpoint="/ask-tenant-ai"
        greeting="Hi, I'm Alica. Ask me about orders, sales, menu, inventory, or your customers."
        suggestions={ALICA_SUGGESTIONS}
      />
    </div>
  );
}
