import { useRouteError } from 'react-router-dom';
import { ErrorFallback, reloadOnceForChunkError } from '@/app/ErrorBoundary';

/**
 * react-router's data router catches errors thrown while rendering/loading a
 * route (including a failed `React.lazy()` import) with its OWN internal
 * error boundary per route — that error never reaches a React error boundary
 * placed outside the router, so the top-level `ErrorBoundary` in main.tsx
 * can't handle this, the single most common real-world case (a stale cached
 * `index.html` referencing a chunk a newer deploy already removed). This is
 * the router's `errorElement`, wired in at the root of the route tree in
 * router.tsx so it covers every route.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  if (reloadOnceForChunkError(error)) {
    return null;
  }

  return <ErrorFallback />;
}
