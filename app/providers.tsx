'use client';

import { GuiProvider } from '@hanzo/gui';
import { useTheme } from 'next-themes';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import IamClientProvider from '@/components/providers/IamClientProvider';
import { AnalyticsRoot } from '@/components/providers/analytics';
import { Toaster } from '@hanzo/ui';
import { ReactNode } from 'react';

import guiConfig from '@/lib/gui.config';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Phase 3 — ONE theme controller. `next-themes` (ThemeProvider) owns the resolved
 * theme (the `.dark`/`.light` class on <html>). GuiProvider's Tamagui root theme
 * now FOLLOWS it via a dynamic `defaultTheme` (the `useRootTheme` pattern) instead
 * of pinning `t_dark` permanently — so every @hanzo/gui surface (menus, the v8
 * product components, the usage panel) renders light in light mode and dark in dark,
 * and the Tamagui-vs-app theme conflict (the `--background !important` workaround +
 * the `--surface-0`-stale-in-light landmine) is gone.
 *
 * Must be a child of ThemeProvider to read `useTheme()`. Server + first paint have
 * no resolved theme yet → default to the brand's "dark" (matches ThemeProvider's
 * defaultTheme, so there is no hydration flip); the client then follows the resolved
 * value.
 */
function GuiThemeBridge({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'light' ? 'light' : 'dark';
  return (
    <GuiProvider config={guiConfig} defaultTheme={theme}>
      {children}
    </GuiProvider>
  );
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      storageKey="hanzo-app-theme"
    >
      <GuiThemeBridge>
        <IamClientProvider>
          <Toaster richColors position="bottom-center" />
          <AnalyticsRoot>
            <ErrorBoundary
              onError={(error, errorInfo) => {
                if (process.env.NODE_ENV === 'production') {
                  console.error('Uncaught error:', error, errorInfo);
                }
              }}
            >
              {children}
            </ErrorBoundary>
          </AnalyticsRoot>
        </IamClientProvider>
      </GuiThemeBridge>
    </ThemeProvider>
  );
}