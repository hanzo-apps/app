/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use default output mode (next start compatible)

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

  // Disable static generation for problematic pages
  generateStaticParams: false,
  dynamicParams: true,

  webpack: (config, { isServer }) => {
    const path = require('path');
    // Fix for build issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    // Shim react-resizable-panels to re-export Group/Separator (removed in v2+)
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-resizable-panels': path.resolve(__dirname, 'lib/shims/react-resizable-panels.js'),
    };
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