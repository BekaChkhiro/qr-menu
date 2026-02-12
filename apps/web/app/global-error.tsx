'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for the entire application
 * This catches errors at the root level that aren't caught by other error boundaries
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error, {
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Something went wrong!
              </h1>
              <p className="text-gray-600">
                We apologize for the inconvenience. An unexpected error occurred.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <pre className="mt-4 overflow-auto rounded-md bg-gray-100 p-4 text-left text-xs text-gray-800">
                  {error.message}
                  {error.digest && `\n\nDigest: ${error.digest}`}
                </pre>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Home className="mr-2 h-4 w-4" />
                Go home
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Error ID: {error.digest || 'Unknown'}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
