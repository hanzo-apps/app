'use client';

import { GuiProvider } from '@hanzo/gui';
import { ErrorBoundary } from '@/components/error-boundary';
import IamClientProvider from '@/components/providers/IamClientProvider';
import { AnalyticsRoot } from '@/components/providers/analytics';
import { UsageLimitProvider } from '@/components/usage/usage-limit';
import { Toaster } from '@hanzo/ui';
import { TooltipProvider } from '@/components/overlay';
import { ReactNode } from 'react';

import guiConfig from '@/lib/gui.config';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * ONE theme, ONE authority: the literal `dark` class the server renders onto
 * <html> (app/layout.tsx). hanzo.app is dark-only — true black ground, white and
 * neutral type, hairline borders — so the theme is a constant, and a constant does
 * not need a controller. Everything here just STATES it: `defaultTheme="dark"` for
 * @hanzo/gui's Tamagui root, `theme="dark"` for the toaster (@hanzo/ui defaults it
 * to `system`, which was the one surface still asking the OS).
 *
 * The next-themes provider that used to wrap this is gone. With `enableSystem` it
 * was a SECOND authority that disagreed with the first — it dropped `.dark` when
 * the OS preferred light while the gui root class stayed `t_dark`, and /catalog
 * and /gallery painted WHITE (measured). Forcing it to dark would have papered
 * over that, but a client controller still resolves after first paint and nothing
 * in the app called `useTheme()` any more, so the whole layer was cost with no
 * payer. No app code imports next-themes now.
 *
 * Consequence, deliberately: the light/system theme pickers are gone from Settings
 * and the user menu. A control that writes a preference nothing can honor is a lie
 * in the UI, not a feature.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <GuiProvider config={guiConfig} defaultTheme="dark" disableInjectCSS>
      <IamClientProvider>
        <Toaster theme="dark" richColors position="bottom-center" />
        <AnalyticsRoot>
          <ErrorBoundary
            onError={(error, errorInfo) => {
              if (process.env.NODE_ENV === 'production') {
                console.error('Uncaught error:', error, errorInfo);
              }
            }}
          >
            <UsageLimitProvider>
              {/* ONE tooltip clock for the whole app: hover delay and the grouped
                  skip-delay are a property of the SESSION, not of each button, so
                  adjacent controls in a toolbar share it instead of each mounting
                  a provider with its own timing. */}
              <TooltipProvider delayDuration={200} skipDelayDuration={300}>
                {children}
              </TooltipProvider>
            </UsageLimitProvider>
          </ErrorBoundary>
        </AnalyticsRoot>
      </IamClientProvider>
    </GuiProvider>
  );
}