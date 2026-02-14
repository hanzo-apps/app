'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Web3Provider } from '@/components/providers/Web3Provider';
import { Toaster } from '@hanzo/ui';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <Toaster richColors position="bottom-center" />
      <AuthProvider>
        <Web3Provider>
          <ErrorBoundary
            onError={(error, errorInfo) => {
              // In production, send to error tracking service
              if (process.env.NODE_ENV === 'production') {
                // TODO: Send to Sentry or similar
                console.error('Production error:', error, errorInfo);
              }
            }}
          >
            {children}
          </ErrorBoundary>
        </Web3Provider>
      </AuthProvider>
    </>
  );
}