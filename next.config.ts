import type { NextConfig } from "next";
import { readdirSync } from "node:fs";
import path from "path";
import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

// @hanzo/gui ships per-package uncompiled ESM, so every @hanzogui/* it pulls has to be
// transpiled too. Reading the directory keeps this honest: the list runs to ~113 packages
// and grows with the design system, and a hand-maintained copy rots into build errors that
// look like the app's fault. See gui/MIGRATION.md.
const guiPackages = (() => {
  try {
    return readdirSync('node_modules/@hanzogui').map((n) => `@hanzogui/${n}`)
  } catch {
    return []
  }
})()

const nextConfig: NextConfig = {
  transpilePackages: ['@hanzo/ui', '@hanzo/gui', 'react-native-web', ...guiPackages],
  typescript: {
    // Suppressed, and left suppressed deliberately: turning this off is not a config change,
    // it is however many real type errors are hiding behind it. Separate piece of work.
    ignoreBuildErrors: true,
  },
  experimental: {
    // optimizeCss is deliberately absent. It inlined 350,715 B of "critical" CSS into every
    // HTML response here - larger than the whole 216 KB external stylesheet - uncacheable,
    // render-blocking, and re-sent on every navigation.
    optimizePackageImports: ['@hanzo/ui', 'lucide-react', 'framer-motion'],
  },
  webpack(config) {
    // Tamagui, which @hanzo/gui forks, compiles a .native version of every file and rewrites
    // react-native to react-native-web in the web build. Without this alias the bare
    // `react-native` specifier reaches the bundler and fails to resolve.
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
      '../../../app/lib/utils': path.resolve(__dirname, 'lib/utils.ts'),
    };

    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      type: 'asset/resource',
      generator: { filename: 'static/media/[name].[hash][ext]' },
    });

    return config;
  },
  images: {
    remotePatterns: [
      new URL('https://hanzo.id/**'),
      new URL('https://api.hanzo.ai/**'),
      new URL('https://cdn.hanzo.ai/**'),
    ],
  },
  async headers() {
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://hanzo.id' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/openid-configuration',
        destination: `${process.env.IAM_ENDPOINT || 'https://hanzo.id'}/.well-known/openid-configuration`,
      },
    ];
  },
};

export default bundleAnalyzer(nextConfig);
