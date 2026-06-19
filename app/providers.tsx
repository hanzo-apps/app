'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import IamClientProvider from '@/components/providers/IamClientProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Web3Provider } from '@/components/providers/Web3Provider';
import { Toaster } from '@hanzo/ui';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <IamClientProvider>
      <Toaster richColors position="bottom-center" />
      <AuthProvider>
        <Web3Provider>
          <ErrorBoundary
            onError={(error, errorInfo) => {
              if (process.env.NODE_ENV === 'production') {
                console.error('Uncaught error:', error, errorInfo);
              }
            }}
          >
            {children}
          </ErrorBoundary>
        </Web3Provider>
      </AuthProvider>
    </IamClientProvider>
  );
}