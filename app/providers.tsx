'use client';

import { GuiProvider } from '@hanzo/gui';
import { ErrorBoundary } from '@/components/error-boundary';
import IamClientProvider from '@/components/providers/IamClientProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { AnalyticsRoot } from '@/components/providers/analytics';
import { Toaster } from '@hanzo/ui';
import { ReactNode } from 'react';

import guiConfig from '@/lib/gui.config';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Phase 0 of the shadcn -> @hanzo/gui migration: hoist the Tamagui provider to
  // the app root (previously scoped to the cloud <UsagePanel>). This is the SAME
  // runtime-mode setup console ships. It is CONTEXT-ONLY — it does not restyle the
  // existing DOM, and we intentionally do NOT import @hanzogui/core/reset.css yet so
  // the current @hanzo/ui (Radix + Tailwind) surfaces render byte-identically. It
  // just makes @hanzo/gui primitives usable ANYWHERE so surfaces can migrate one by
  // one behind this single provider (DRY) until shadcn is fully removed. Dark is
  // fixed for now (server + client agree; full light/dark lands with the token pass).
  return (
    <GuiProvider config={guiConfig} defaultTheme="dark">
      <IamClientProvider>
        <Toaster richColors position="bottom-center" />
        <AnalyticsRoot>
          <AuthProvider>
            <ErrorBoundary
              onError={(error, errorInfo) => {
                if (process.env.NODE_ENV === 'production') {
                  console.error('Uncaught error:', error, errorInfo);
                }
              }}
            >
              {children}
            </ErrorBoundary>
          </AuthProvider>
        </AnalyticsRoot>
      </IamClientProvider>
    </GuiProvider>
  );
}