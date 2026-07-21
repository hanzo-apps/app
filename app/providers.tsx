'use client';

import { GuiProvider } from '@hanzo/gui';
import { ThemeProvider } from '@/components/providers/theme-provider';
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
  // Theme: ONE controller. `next-themes` (ThemeProvider) owns the `.dark` class on
  // <html> — that class drives BOTH the Tailwind token layer (assets/globals.css
  // `@custom-variant dark`, the visible UI) AND the settings toggle + sonner, which
  // read `useTheme()`. Previously this provider was never mounted, so the toggle was
  // dead and only GuiProvider's hardcoded dark applied. GuiProvider is CONTEXT-ONLY
  // (it does not restyle the DOM — @hanzo/ui Radix+Tailwind surfaces still paint
  // everything), so the class-based token layer is the whole lever.
  //
  // Safe rollout: defaultTheme dark + enableSystem FALSE — existing users stay dark
  // (zero visual change) and light is strictly opt-in via the toggle until the token
  // pass is verified across every product surface. Flip enableSystem on afterwards.
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="hanzo-app-theme"
    >
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
    </ThemeProvider>
  );
}