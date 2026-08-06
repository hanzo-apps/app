import path from 'node:path';

import { withGui } from '@hanzogui/next-plugin';
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

// STATIC EXTRACTION — WORKING, AND A NET LOSS HERE. Read the numbers before
// shipping this.
//
// Without it every atomic rule is authored at RUNTIME, through
// `CSSStyleSheet.insertRule` into a <style> in the document, re-sent with every
// HTML response and cacheable by nobody. `withGui` runs the same styled()
// evaluation at build time: each module's rules become a `.hanzogui.css` sibling
// Next bundles into the linked stylesheet, and the markup ships class names
// already resolved. It runs — 443 files extracted, no errors — and it costs more
// than it saves, because the two sheets are not the same set of rules.
//
// Measured (scripts/measure-css.mjs, 8 routes, production build, same binaries
// both sides). CSS delivered = inline rule bytes + linked wire bytes. The inline
// half falls on every route; the linked half rises by more, every time:
//
//   route       inline CSS         linked CSS          total       atomic rules
//   /pricing    33,751 -> 22,377   120,165 -> 149,775  +18,236     441 -> 742
//   /templates  53,533 -> 49,695   120,165 -> 147,585  +23,582     513 -> 917
//   /install    29,301 -> 20,149   120,165 -> 145,122  +15,805     384 -> 641
//   sum, 8 rts  1,276,487 -> 1,496,696  = +220,209 B (+17.3%);  JS +257,645
//
// The runtime writes only the rules that render. The extractor emits every rule
// a module COULD produce and re-emits shared rules into each route chunk — 495
// linked rules on /pricing, 257 of them distinct, declaring 315 classes for the
// 231 the page renders. A superset cannot beat the minimum on bytes.
//
// It never removes runtime injection either: @hanzo/ui ships from node_modules
// and @hanzogui/loader 8.1.0 declines node_modules, so /templates still writes
// 430 of its 501 atomic rules at render time. Coverage is unaffected in both
// directions — 0 atomic classes without a rule before or after, on every route.
//
// `components` is how the extractor knows which imports ARE gui components:
// @hanzo/ui is where this app's elements come from, @hanzo/gui is the config it
// registers against.
//
// `disableAliases`: GuiPlugin's own `react-native$` / `react-native-web$`
// aliases resolve from the loader's directory, which under pnpm is a different
// physical copy than the one the block at the top of this file pins. Two copies
// of the module registry is exactly the "Missing theme." failure that comment
// describes, so this app keeps the aliases it already declares.
//
// `outputCSS` is deliberately absent, and scripts/gen-gui-css.mjs is not a
// workaround for it. outputCSS writes `config.getCSS()` whole — 351,611 B, every
// color family in @hanzo/ui's config. gen-gui-css.mjs writes the same sheet
// pruned to the themes this app mounts: 80,205 B. Swapping one for the other
// adds 271,406 B of linked CSS to every route.
export default withGui({
  config: './lib/gui.ts',
  components: ['@hanzo/ui', '@hanzo/gui'],
  disableAliases: true,
  logTimings: true,
})(nextConfig);
