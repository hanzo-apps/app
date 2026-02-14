/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization to avoid prerendering errors
  output: 'standalone',

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
    // Fix for build issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

module.exports = nextConfig