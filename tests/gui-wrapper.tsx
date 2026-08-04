// The gui context every @hanzo/ui component renders inside, for tests that
// render the REAL components.
//
// @hanzo/ui is built on @hanzogui, which reads a `createGui` config at render
// and throws "Missing hanzogui config" without one. In the app that config is
// mounted once, at the root, by app/providers.tsx — so a component rendered bare
// in a test is a component in a state the app never puts it in, and the failure
// says nothing about the component.
//
// The config is `@/lib/gui` — the SAME one providers.tsx passes, not a
// test-shaped copy — because these suites exist to catch a real regression on a
// version bump, and a second config could pass while the app's failed.
//
// `disableInjectCSS` matches the app: the stylesheet is emitted at build time
// from config.getCSS(), so nothing needs to inject it here.
import type { ReactNode } from 'react';
import { GuiProvider } from '@hanzo/gui';

import guiConfig from '@/lib/gui';

export function WithGui({ children }: { children: ReactNode }) {
  return (
    <GuiProvider config={guiConfig} defaultTheme="dark" disableInjectCSS>
      {children}
    </GuiProvider>
  );
}
