import { Component, type ReactNode } from 'react';

const CHUNK_RELOAD_FLAG = 'orbitfood-chunk-reload-attempted';

/**
 * A deploy replaces every hashed chunk filename, but a browser can still be
 * holding an old cached `index.html` (or an open tab from before the deploy)
 * that references chunks which no longer exist on disk. The resulting
 * dynamic-import rejection has no chunk-loading retry built in, so without
 * this check it throws straight through to the fallback UI on every load —
 * reloading once is usually enough to pick up the current `index.html` and
 * its real chunk hashes.
 */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|loading chunk|importing a module script failed/i.test(message);
}

/** True if a reload-on-chunk-error hasn't already been tried this browser session. */
export function reloadOnceForChunkError(error: unknown): boolean {
  if (!isChunkLoadError(error) || sessionStorage.getItem(CHUNK_RELOAD_FLAG)) {
    return false;
  }
  sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1');
  window.location.reload();
  return true;
}

/**
 * Render-error safety net's visual fallback. Plain inline styles only — this
 * must render correctly even if the app's own stylesheet failed to load as
 * part of the same failure.
 */
export function ErrorFallback() {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080b14',
        color: '#f3f5ff',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 360 }}>
        <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Something went wrong</p>
        <p style={{ fontSize: 14, color: '#b3b9cc', margin: 0 }}>
          Please reload the page. If this keeps happening, try clearing your browser cache.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            height: 40,
            padding: '0 20px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(to bottom, #8b6cff, #6246d8)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Top-level render-error safety net for anything thrown *outside* the router
 * tree (route-level errors — including a failed lazy-route import, the most
 * common real-world case — are caught by the router's own `errorElement`
 * instead; see RouteErrorBoundary). Without this, an uncaught error here
 * would unmount the whole app to a blank white page with nothing in the UI
 * to explain why.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    reloadOnceForChunkError(error);
  }

  render() {
    return this.state.hasError ? <ErrorFallback /> : this.props.children;
  }
}
