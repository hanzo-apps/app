import path from 'node:path';

import type { NextConfig } from 'next';

import { transpiled, guiClosure } from './transpile';

// ONE instance of every gui package, and ONE react-native-web under it.
//
// pnpm keys a package directory by its PEER set, so @hanzogui/web installed
// under a react-native peer and the same version under a react-native-web peer
// are two physical directories — and therefore two module registries. gui keeps
// the theme name and the media table in module state, so a second copy means
// `GuiProvider` fills registry A while `Toaster` reads registry B and throws
// "Missing theme." Aliasing each package to one absolute path collapses them.
//
// Absolute paths, not bare specifiers: under pnpm a bare alias resolves from
// each importer's own directory, so half the gui graph would miss it.
const guiPkg = require.resolve('@hanzo/gui/package.json');
const resolveDir = (name: string, from: string) =>
  path.dirname(require.resolve(`${name}/package.json`, { paths: [from] }));

// react-native-web is resolved from THIS app: gui 8 dropped it as a dependency
// (7.3.1 declared `react-native-web: ^0.21.0`, 8.0.1 declares none), so
// resolving it through gui — which is what the config did — now throws.
const reactNativeWeb = resolveDir('react-native-web', __filename);

// The closure, not gui's direct dependencies: @hanzogui/web — the package the
// duplicate-registry failure is actually about — is reached through
// @hanzogui/spacer, so a direct-only pass would alias everything except the one
// that matters.
const guiAliases = Object.fromEntries(
  guiClosure().flatMap((name: string) => {
    try {
      return [[`${name}$`, resolveDir(name, guiPkg)]];
    } catch {
      return [];
    }
  }),
);

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

  // /help sent everyone to docs.hanzo.ai. That was right in July, when /help
  // 404'd and the redirect was the cheapest way to make the footer links
  // resolve. `app/help/page.tsx` — the support hub, with the real channels on
  // it — landed on 2026-07-18 and has never once been reachable, because a
  // redirect runs BEFORE routing: the page was written, deployed, and shadowed.
  //
  // The premise expired, not the route. Five link sites point at /help (the
  // header nav, pricing, docs, faq, and /support, which redirects here), and
  // every one of them was leaving the app: docs.hanzo.ai is a different
  // application (fumadocs), and on a phone it is the worse place to arrive —
  // measured at 375x667, 56 of its 72 tap targets are under 44px, against 0 of
  // 68 on this app's own pages.
  async redirects() {
    return [
      // The apps catalog moved to /install; keep old /apps links alive.
      { source: '/apps', destination: '/install', permanent: true },
    ];
  },

  // The Enso/edit widget is a MUTABLE script dropped into every Hanzo app, but
  // the origin set no Cache-Control, so Cloudflare stamped its default 4h browser
  // TTL — and a fix to edit.js sat stale in every open tab for up to four hours
  // (an owner "checked" the enso fix and still saw the pre-fix hairline floating
  // over the preview). A widget we reship must revalidate, not linger: 5-minute
  // freshness with a background stale-while-revalidate window, so an update
  // reaches a loaded page on its next navigation, not next quarter-day. Sibling
  // public assets (hashed chunks, template thumbnails, fonts) are content-
  // addressed and keep their long immutable cache — this rule is scoped to the
  // one file that changes under a stable URL.
  async headers() {
    return [
      {
        source: '/edit.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=3600' },
        ],
      },
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
      'react-native$': reactNativeWeb,
      ...guiAliases,
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

    // Semantic hierarchy for telemetry: stamp every component's root element
    // with its own name (`data-observe="UserCard"`) so a PRODUCTION build keeps
    // the component tree React's dev-only fiber owner would have given us — the
    // difference between insights recording "a click on a button" and "a click
    // on Save, inside UserCard, inside Dashboard".
    //
    // A pre-loader, deliberately: SWC still does the real compiling. Adding a
    // Babel config to get a Babel plugin would switch this whole app off SWC and
    // cost far more than the feature is worth. The transform parses with
    // TypeScript and splices text, so line numbers survive and a stack trace
    // still points at the right line; anything it cannot parse passes through
    // untouched, because a build must never fail over an observability nicety.
    config.module.rules.push({
      test: /\.(t|j)sx$/,
      exclude: /node_modules/,
      use: require.resolve('@hanzo/annotate/webpack'),
    });

    return config;
  },
};

export default nextConfig;
