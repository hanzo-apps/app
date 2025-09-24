import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@hanzo/ui"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: true,
  modularizeImports: {
    '@hanzo/ui': {
      transform: '@hanzo/ui/primitives/{{member}}',
      skipDefaultConversion: true,
    },
  },
  // Bundle optimization settings
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "@hanzo/ui",
      "lucide-react",
      "@radix-ui",
      "framer-motion"
    ],
  },
  webpack(config, options) {
    const { isServer, dev } = options;

    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Separate chunk for @hanzo/ui
            hanzoui: {
              name: 'hanzo-ui',
              test: /[\\/]node_modules[\\/]@hanzo[\\/]ui/,
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Fix utils import issue
    config.resolve.alias = {
      ...config.resolve.alias,
      '../../../app/lib/utils': path.resolve(__dirname, 'lib/utils.ts'),
    };

    // Add a custom rule to handle TypeScript files in @hanzo/ui using swc-loader
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
            },
            module: {
              type: isServer ? 'commonjs' : 'es6',
            },
          },
        },
      ],
    });

    // Ensure other rules don't process @hanzo/ui
    config.module.rules.forEach((rule: any, index: number) => {
      if (index === 0) return; // Skip our custom rule

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

    return config;
  },
  images: {
    remotePatterns: [new URL('https://huggingface.co/**')],
  },
};

export default nextConfig;