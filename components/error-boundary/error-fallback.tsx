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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-red-500/20 bg-red-500/[0.07] p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-red-500/15 rounded-full p-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-medium text-foreground">
                  {level === 'app' ? 'Application Error' : 'Page Error'}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
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
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <h2 className="text-sm font-medium text-muted-foreground mb-2">
                    Error Details (Development Only)
                  </h2>
                  <p className="text-sm text-foreground font-mono break-all">
                    {error.message}
                  </p>
                </div>

                {error.stack && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Stack Trace
                    </summary>
                    <pre className="mt-2 bg-muted rounded p-3 overflow-x-auto text-muted-foreground">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {!isDevelopment && (
              <div className="mb-6">
                <p className="text-muted-foreground">
                  We apologize for the inconvenience. The error has been logged and our team will
                  investigate the issue.
                </p>
                <div className="mt-4 p-3 bg-muted border border-border rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>Error ID:</strong> {generateErrorId()}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {!isPermanent && (
                <button
                  onClick={resetErrorBoundary}
                  className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              )}

              {isPermanent && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Page</span>
                </button>
              )}

              <button
                onClick={handleGoHome}
                className="w-full flex items-center justify-center space-x-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 px-4 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Go to Homepage</span>
              </button>

              {!isDevelopment && (
                <button
                  onClick={handleReportBug}
                  className="w-full flex items-center justify-center space-x-2 border border-border hover:bg-accent text-foreground py-3 px-4 rounded-lg transition-colors"
                >
                  <Bug className="w-4 h-4" />
                  <span>Report This Issue</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {isDevelopment && (
          <div className="mt-4 text-center text-xs text-muted-foreground">
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