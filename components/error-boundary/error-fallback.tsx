'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  level?: 'page' | 'component' | 'app';
  isPermanent?: boolean;
  isolate?: boolean;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  level = 'component',
  isPermanent = false,
  isolate = false,
}: ErrorFallbackProps) {
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleGoHome = () => {
    router.push('/');
  };

  const handleReportBug = () => {
    // Open bug report form or redirect to support
    const bugReportUrl = `/support?error=${encodeURIComponent(error.message)}`;
    router.push(bugReportUrl);
  };

  // Component-level error - small inline error
  if (level === 'component' && !isPermanent) {
    return (
      <div className={`${isolate ? 'absolute inset-0' : ''} flex items-center justify-center p-4`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Component Error
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {isDevelopment ? error.message : 'Something went wrong with this component.'}
              </p>
              <button
                onClick={resetErrorBoundary}
                className="mt-3 text-sm text-red-600 dark:text-red-300 hover:text-red-500 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page or App level error - full page error
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {level === 'app' ? 'Application Error' : 'Page Error'}
                </h1>
                <p className="text-red-100 text-sm mt-1">
                  {isPermanent
                    ? 'Multiple errors detected. Please refresh the page.'
                    : 'An unexpected error occurred.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isDevelopment && (
              <div className="mb-6">
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-4">
                  <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Error Details (Development Only)
                  </h2>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-mono break-all">
                    {error.message}
                  </p>
                </div>

                {error.stack && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      View Stack Trace
                    </summary>
                    <pre className="mt-2 bg-gray-100 dark:bg-gray-900 rounded p-3 overflow-x-auto text-gray-700 dark:text-gray-300">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {!isDevelopment && (
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300">
                  We apologize for the inconvenience. The error has been logged and our team will
                  investigate the issue.
                </p>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Error ID:</strong> {generateErrorId()}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {!isPermanent && (
                <button
                  onClick={resetErrorBoundary}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              )}

              {isPermanent && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Page</span>
                </button>
              )}

              <button
                onClick={handleGoHome}
                className="w-full flex items-center justify-center space-x-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Go to Homepage</span>
              </button>

              {!isDevelopment && (
                <button
                  onClick={handleReportBug}
                  className="w-full flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg transition-colors"
                >
                  <Bug className="w-4 h-4" />
                  <span>Report This Issue</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {isDevelopment && (
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            This detailed error view is only shown in development mode.
          </div>
        )}
      </div>
    </div>
  );
}

function generateErrorId(): string {
  return `ERR_${Date.now().toString(36).toUpperCase()}_${Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase()}`;
}