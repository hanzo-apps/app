import type { NextConfig } from "next";
import path from "path";
import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  // Existing config
  transpilePackages: ["@hanzo/ui"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: true,

  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Modular imports for tree shaking
  modularizeImports: {
    '@hanzo/ui': {
      transform: '@hanzo/ui/primitives/{{member}}',
      skipDefaultConversion: true,
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    '@radix-ui': {
      transform: '@radix-ui/{{member}}',
      skipDefaultConversion: true,
    },
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },

  // Experimental performance features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "@hanzo/ui",
      "lucide-react",
      "@radix-ui",
      "framer-motion",
      "react-icons",
      "@tanstack/react-query",
      "date-fns"
    ],
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
  },

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'iam.hanzo.ai' },
      { protocol: 'https', hostname: 'cdn.hanzo.ai' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // Webpack optimizations
  webpack(config, options) {
    const { isServer, dev } = options;

    // Production optimizations
    if (!dev) {
      // Enable long-term caching
      config.optimization.moduleIds = 'deterministic';
      config.optimization.runtimeChunk = 'single';

      if (!isServer) {
        // Advanced code splitting
        config.optimization.splitChunks = {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,

            // Framework chunk
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },

            // Library chunk
            lib: {
              test(module: any) {
                return module.size() > 50000 &&
                  /node_modules[\\/]/.test(module.identifier());
              },
              name(module: any) {
                const hash = require('crypto')
                  .createHash('sha1')
                  .update(module.identifier())
                  .digest('hex');
                return `lib-${hash.substring(0, 8)}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },

            // Commons chunk
            commons: {
              name: 'commons',
              chunks: 'initial',
              minChunks: 2,
              priority: 20,
            },

            // Shared chunk
            shared: {
              name(module: any, chunks: any) {
                const hash = require('crypto')
                  .createHash('sha1')
                  .update(chunks.map((c: any) => c.name).join('_'))
                  .digest('hex');
                return `shared-${hash.substring(0, 8)}`;
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },

            // @hanzo/ui chunk
            hanzoui: {
              name: 'hanzo-ui',
              test: /[\\/]node_modules[\\/]@hanzo[\\/]ui/,
              chunks: 'all',
              priority: 35,
              reuseExistingChunk: true,
            },

            // Radix UI chunk
            radixui: {
              name: 'radix-ui',
              test: /[\\/]node_modules[\\/]@radix-ui/,
              chunks: 'all',
              priority: 34,
              reuseExistingChunk: true,
            },

            // React Query chunk
            reactquery: {
              name: 'react-query',
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query/,
              chunks: 'all',
              priority: 33,
              reuseExistingChunk: true,
            },

            // Icons chunk
            icons: {
              name: 'icons',
              test: /[\\/]node_modules[\\/](lucide-react|react-icons)/,
              chunks: 'all',
              priority: 32,
              reuseExistingChunk: true,
            },
          },
        };

        // Minimize main bundle
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;

        // Enable tree shaking
        config.optimization.providedExports = true;
        config.optimization.innerGraph = true;
      }
    }

    // Fix utils import issue
    config.resolve.alias = {
      ...config.resolve.alias,
      '../../../app/lib/utils': path.resolve(__dirname, 'lib/utils.ts'),
    };

    // Add custom rule for @hanzo/ui
    config.module.rules.unshift({
      test: /\.(tsx?|jsx?)$/,
      include: /node_modules[\\/]@hanzo[\\/]ui/,
      use: [
        {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
                decorators: false,
                dynamicImport: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  pragmaFrag: 'React.Fragment',
                  throwIfNamespace: true,
                  development: dev,
                  useBuiltins: true,
                },
              },
              target: 'es2020',
              minify: !dev && {
                compress: {
                  unused: true,
                },
                mangle: true,
              },
            },
            module: {
              type: isServer ? 'commonjs' : 'es6',
            },
            minify: !dev,
          },
        },
      ],
    });

    // Ensure other rules don't process @hanzo/ui
    config.module.rules.forEach((rule: any, index: number) => {
      if (index === 0) return;

      if (rule.oneOf) {
        rule.oneOf = rule.oneOf.map((oneOfRule: any) => {
          if (oneOfRule.test && oneOfRule.test.toString().includes('tsx')) {
            if (!oneOfRule.exclude) {
              oneOfRule.exclude = [];
            }
            if (Array.isArray(oneOfRule.exclude)) {
              oneOfRule.exclude.push(/node_modules[\\/]@hanzo[\\/]ui/);
            } else {
              oneOfRule.exclude = [oneOfRule.exclude, /node_modules[\\/]@hanzo[\\/]ui/];
            }
          }
          return oneOfRule;
        });
      }
    });

    // Audio files loader
    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]',
      },
    });

    // Worker loader for service workers
    if (!isServer) {
      config.module.rules.push({
        test: /\.worker\.(js|ts)$/,
        use: { loader: 'worker-loader' },
      });
    }

    return config;
  },

  // Redirect and rewrite optimizations
  async redirects() {
    return [];
  },

  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default bundleAnalyzer(nextConfig);