import type { NextConfig } from 'next';

import { withGui } from '@hanzogui/next-plugin';

import { transpiled } from './transpile';

const nextConfig: NextConfig = {
  // Standalone output — Next traces only the server deps actually used, so the
  // runtime image is a fraction of the full node_modules. Dockerfile:51 copies
  // .next/standalone; without this the directory is never emitted and no image
  // can be built.
  output: 'standalone',

  transpilePackages: transpiled(),

  // Next 16 reduced devIndicators to one key. appIsrStatus and buildActivity
  // were the toggles that hid the overlay and no longer exist; only where it
  // sits is still configurable, so the position carries over and the rest goes.
  devIndicators: {
    position: 'bottom-right',
  },

  // No eslint key: Next 16 removed the build-time ESLint integration, so
  // ignoreDuringBuilds suppressed a step that no longer runs. Linting is its
  // own script and its own CI job, which is where it belonged anyway.

  typescript: {
    // Suppressed, and left suppressed deliberately: turning this off is not a
    // config change, it is however many real type errors are hiding behind it.
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'iam.hanzo.ai' },
      { protocol: 'https', hostname: 'cdn.hanzo.ai' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
    ],
  },

  experimental: {
    // TEMP: readable server stacks while tracking the Tamagui prerender crash.
    serverMinification: false,
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // optimizeCss is deliberately absent. It inlined 350,715 B of "critical"
    // CSS into every HTML response here — larger than the whole 216 KB external
    // stylesheet, uncacheable, render-blocking, re-sent on every navigation.
  },

  // /help was a dead route (404) linked from the builder footer and marketing
  // footers. Point it at the real docs so every "Help" link resolves — one rule
  // instead of editing each link site.
  async redirects() {
    return [
      { source: '/help', destination: 'https://docs.hanzo.ai', permanent: false },
      // The apps catalog moved to /install; keep old /apps links alive.
      { source: '/apps', destination: '/install', permanent: true },
    ];
  },

  // generateStaticParams and dynamicParams used to sit here. They are route
  // SEGMENT exports, not config keys, so at this level they were read by
  // nothing and had never done anything. Set them in the route that needs them.

  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      // MetaMask SDK pulls these in; the browser needs neither.
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };

    config.resolve.alias = {
      ...config.resolve.alias,
      // @hanzo/gui (Tamagui) targets react-native; on web the bare specifier
      // maps to react-native-web (exact-match so subpaths hit the real package).
      'react-native$': 'react-native-web',
    };

    // PREPEND the web extensions so react-native packages resolve their
    // `.web.js` siblings over the native/fabric files. Without this,
    // @hanzogui/lucide-icons-2 → react-native-svg loads its fabric
    // `*NativeComponent.js`, which imports react-native Flow source that
    // webpack cannot parse.
    config.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      ...config.resolve.extensions,
    ];

    return config;
  },
};

// Tamagui's Next plugin. It is what makes @hanzo/ui render on the SERVER: without
// it the config module never evaluates in the server bundle, so useMedia proxied an
// undefined media state and `next build` died on every page with "Cannot create
// proxy with a non-object as target or handler" — and forcing prerendering off only
// moved that same 500 to request time.
//
// It could not be installed until now: @hanzogui/next-plugin@7.3.1 depends on
// hanzogui-loader@7.3.0, a version that was never published (only 2.0.0-rc.41 and
// 102.0.0-rc.41 exist). The pnpm override in package.json pins the published one.
// Drop the override once a matching loader ships.
export default withGui({
  config: './lib/gui.config.ts',
  // Every package whose components the loader must process. @hanzogui/shell is
  // here because SiteFooter renders HanzoFooter from a SERVER component, so it
  // is the one Tamagui surface the plugin has to handle for a page to prerender
  // — without it /templates/[slug] was the last route still failing.
  // EVERY package whose Tamagui components can reach a render. Missing one does
  // not fail loudly — the page just dies in useMedia with "Cannot create proxy
  // with a non-object". @hanzo/usage is here because UsageLimitProvider sits in
  // the ROOT layout, so it reaches pages that import nothing themselves.
  components: ['@hanzo/ui', '@hanzo/gui', '@hanzo/usage', '@hanzogui/shell'],
  appDir: true,
})(nextConfig);
