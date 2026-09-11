import React from 'react';

/**
 * RootErrorBoundary — catches uncaught render errors from any descendant and
 * renders a recoverable fallback instead of a blank screen.
 *
 * On error we:
 *  - log the error to the console (engineers can grab the stack from devtools)
 *  - best-effort fire-and-forget POST to `/api/v1/health/telemetry` so the backend
 *    can record it server-side. The route is intentionally on `/health` which is
 *    already public; if the endpoint doesn't exist we silently swallow.
 *
 * The fallback gives operators two recovery paths:
 *  - "Reload screen" — a hard reload
 *  - "Try again" — clears the boundary and re-renders the children (useful for
 *    transient hydration errors).
 */

interface RootErrorBoundaryProps {
  /** Short label for the app, e.g. "POS", "Driver". Shown in the fallback header. */
  appName: string;
  apiUrl?: string;
  children: React.ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends React.Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  state: RootErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Devtools-friendly logging.
    console.error('[RootErrorBoundary]', this.props.appName, error, info);

    const apiUrl =
      this.props.apiUrl ||
      ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
        'http://localhost:3000');

    try {
      void fetch(`${apiUrl}/api/v1/health/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          app: this.props.appName,
          message: error.message,
          stack: error.stack,
          componentStack: info.componentStack,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          at: new Date().toISOString(),
        }),
      }).catch(() => {
        /* telemetry is best-effort */
      });
    } catch {
      /* noop */
    }
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            color: '#f8fafc',
            padding: '2rem',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {this.props.appName} hit an unexpected error
            </h1>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
              Your data is safe. You can try again, or reload the screen.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  background: '#1e293b',
                  padding: '0.75rem',
                  borderRadius: 8,
                  fontSize: 12,
                  textAlign: 'left',
                  overflow: 'auto',
                  marginBottom: '1.25rem',
                  maxHeight: 160,
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: '#475569',
                  color: 'white',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reload screen
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;
