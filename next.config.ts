import type { NextConfig } from 'next';

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

export default nextConfig;
