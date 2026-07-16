const fs = require('fs');
const path = require('path');

// The cloud <UsagePanel> (@hanzo/usage/panel) is a @hanzo/gui (Tamagui) component
// shipped as SOURCE, so Next must transpile it and the whole @hanzogui/* graph +
// react-native-web (discovered, not hardcoded — the set moves with the gui version).
// Same recipe console uses; @hanzogui/next-plugin has a broken dep so we lean on
// Next's built-in transpilePackages + a react-native→react-native-web alias instead.
function guiPackages() {
  let scoped = [];
  try {
    const dir = path.join(__dirname, 'node_modules', '@hanzogui');
    scoped = fs.readdirSync(dir).map((name) => `@hanzogui/${name}`);
  } catch {
    scoped = [];
  }
  return ['@hanzo/gui', '@hanzo/usage', 'react-native-web', ...scoped];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output — Next traces only the server deps actually used, so the
  // runtime image is a fraction of the full node_modules (see Dockerfile.production).
  output: "standalone",

  transpilePackages: guiPackages(),

  // Disable development indicators in production
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },

  eslint: {
    ignoreDuringBuilds: true,
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
    ];
  },

  // Disable static generation for problematic pages
  generateStaticParams: false,
  dynamicParams: true,

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
      'react-native$': 'react-native-web',
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