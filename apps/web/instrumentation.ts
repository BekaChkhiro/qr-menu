/**
 * Next.js Instrumentation
 * This file is used to initialize monitoring and tracing on both server and edge runtimes
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry initialization
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry initialization
    await import('./sentry.edge.config');
  }
}

/**
 * Optional: Handle uncaught exceptions
 * Note: This is called for unhandled errors during server-side rendering
 */
export function onRequestError(
  err: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'middleware' | 'action';
    revalidateReason: 'on-demand' | 'stale' | undefined;
    renderSource: 'react-server-components' | 'react-server-components-payload' | 'server-rendering';
  }
) {
  // Import Sentry dynamically to avoid issues during build
  import('@sentry/nextjs').then(({ captureException }) => {
    captureException(err, {
      extra: {
        path: request.path,
        method: request.method,
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
        digest: err.digest,
      },
    });
  });
}
