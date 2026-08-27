import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from '@/app/router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface-glass-strong)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
