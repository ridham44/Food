import { Loader2 } from 'lucide-react';

export function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
