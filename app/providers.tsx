'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
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
  );
}