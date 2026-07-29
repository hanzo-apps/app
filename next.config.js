const path = require('path');

// The cloud <UsagePanel> (@hanzo/usage/panel) is a @hanzo/gui (Tamagui) component
// shipped as SOURCE, so Next must transpile it and the whole @hanzogui/* graph +
// react-native-web. That set is READ FROM @hanzo/gui's own dependencies, which is
// where it is actually declared — a scan of node_modules/@hanzogui would only see
// what pnpm hoists to this app's root, i.e. what we happen to depend on directly,
// which is why the app used to carry five @hanzogui/* deps it never imported.
// Same recipe console uses; @hanzogui/next-plugin has a broken dep so we lean on
// Next's built-in transpilePackages + a react-native→react-native-web alias instead.
//
// Second group: deps that ship ESM ONLY. Next copes either way, but a CJS
// consumer (the jest runtime, which reads this same list via next/jest) is
// handed a bare `export {}` unless they are transpiled. ONE list, so the build
// and the tests can never disagree about what needs transforming.
function transpiled() {
  const gui = Object.keys(require('@hanzo/gui/package.json').dependencies || {});
  // @hanzogui/shell ships compiled dist, but transpile it (+ @hanzo/brand) so
  // Next handles any raw pieces uniformly — harmless with dist, required if the
  // shell ever ships source.
  return [
    '@hanzo/gui',
    '@hanzo/usage',
    '@hanzogui/shell',
    '@hanzo/brand',
    ...gui,
    // ESM-only
    'jose',
  ];
}

// The ONE react-native-web copy, resolved through @hanzo/gui (which declares it).
// An absolute path, not a bare specifier: under pnpm a bare alias resolves from
// each importer's own directory, so half the @hanzogui/* graph would miss it.
const guiPkg = require.resolve('@hanzo/gui/package.json');
const reactNativeWeb = path.dirname(
  require.resolve('react-native-web/package.json', { paths: [guiPkg] }),
);

// ONE instance of every gui package, resolved through @hanzo/gui.
//
// pnpm keys a package directory by its PEER set, so @hanzogui/web installed under
// a react-native peer and the same version installed under a react-native-web peer
// are two physical copies — and therefore two module registries. gui keeps the
// theme name and the media table in module state, so a second copy means
// `GuiProvider` fills registry A while `Toaster` reads registry B and throws
// "Missing theme." Aliasing each package to one absolute path collapses them.
const guiAliases = Object.fromEntries(
  Object.keys(require('@hanzo/gui/package.json').dependencies || {})
    .filter((name) => name.startsWith('@hanzogui/'))
    .map((name) => {
      try {
        return [`${name}$`, path.dirname(require.resolve(`${name}/package.json`, { paths: [guiPkg] }))];
      } catch {
        return null;
      }
    })
    .filter(Boolean),
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output — Next traces only the server deps actually used, so the
  // runtime image is a fraction of the full node_modules (see Dockerfile.production).
  output: "standalone",

  transpilePackages: transpiled(),

  // Disable development indicators in production
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iam.hanzo.ai',
      },
      {
        protocol: 'https',
        hostname: 'cdn.hanzo.ai',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // /help was a dead route (404) linked from the builder footer and marketing
  // footers. Point it at the real docs so every "Help" link resolves — one rule
  // instead of editing each link site.
  async redirects() {
    return [
      {
        source: '/help',
        destination: 'https://docs.hanzo.ai',
        permanent: false,
      },
      // The apps catalog moved to /install; keep old /apps links (bookmarks,
      // external refs) alive instead of 404ing. Lost to multi-session churn when
      // the page was moved — restored so the move is clean end-to-end.
      { source: '/apps', destination: '/install', permanent: true },
    ];
  },

  webpack: (config, { isServer }) => {
    // Fix for build issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    // Shim react-resizable-panels to re-export Group/Separator (removed in v2+)
    config.resolve.alias = {
      ...config.resolve.alias,
      // Exact-match ($) so ONLY the bare specifier is shimmed — the shim's own
      // `react-resizable-panels/dist/...` subpath import must resolve to the real
      // package, else it aliases back to the shim → infinite SSR recursion.
      'react-resizable-panels$': path.resolve(__dirname, 'lib/shims/react-resizable-panels.js'),
      // @hanzo/gui (Tamagui) targets react-native; on web the bare specifier maps
      // to react-native-web (exact-match so subpath imports hit the real package).
      'react-native$': reactNativeWeb,
      ...guiAliases,
    };
    // PREPEND the web extensions so react-native packages resolve their `.web.js`
    // siblings over the native/fabric files. Without this, @hanzogui/lucide-icons-2
    // → react-native-svg loads its fabric `*NativeComponent.js`, which imports
    // react-native Flow source (`react-native/Libraries/...`) that webpack cannot
    // parse. This is the same recipe the console uses to bundle <UsagePanel>.
    config.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      ...config.resolve.extensions,
    ];
    // Externalize React Native deps (MetaMask SDK brings these in but they're not needed in browser)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };
    return config;
  },
}

module.exports = nextConfig