'use client';

import React, { useEffect } from 'react';
import { errorLogger, ErrorSeverity } from '@/lib/error-handling/error-logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our error tracking service
    errorLogger.logError(error, ErrorSeverity.CRITICAL, {
      component: 'GlobalError',
      action: 'UnhandledError',
      metadata: {
        digest: error.digest,
        message: error.message,
        stack: error.stack,
      },
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Critical Error</h1>
                    <p className="text-red-100 text-sm mt-1">
                      The application encountered a critical error
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <p className="text-gray-300">
                    We apologize for the inconvenience. The application has encountered an
                    unexpected error and needs to restart. Our team has been notified.
                  </p>
                  {error.digest && (
                    <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800">
                      <p className="text-sm text-blue-300">
                        <strong>Error Reference:</strong> {error.digest}
                      </p>
                    </div>
                  )}
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-6">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-400 hover:text-gray-200 mb-2">
                        View Error Details (Development Only)
                      </summary>
                      <div className="bg-gray-800 rounded-lg p-4 mb-2">
                        <p className="text-sm text-gray-200 font-mono break-all">
                          {error.message}
                        </p>
                      </div>
                      {error.stack && (
                        <pre className="bg-gray-800 rounded-lg p-3 overflow-x-auto text-gray-300">
                          {error.stack}
                        </pre>
                      )}
                    </details>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={reset}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Try Again</span>
                  </button>

                  <button
                    onClick={() => (window.location.href = '/')}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-200 py-3 px-4 rounded-lg transition-colors border border-gray-700"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span>Go to Homepage</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}