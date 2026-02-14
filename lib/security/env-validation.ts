import { z } from 'zod';

// Check if we're in a CI/build environment
const isCI = process.env.CI === 'true' || process.env.NEXT_BUILD_ONLY === 'true';
const isProd = process.env.NODE_ENV === 'production';

// Define environment variable schema - required fields only enforced in production
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Authentication (Hanzo IAM) - only required in production
  IAM_CLIENT_ID: isProd && !isCI ? z.string().min(1) : z.string().optional(),
  IAM_CLIENT_SECRET: isProd && !isCI ? z.string().min(1) : z.string().optional(),
  IAM_ENDPOINT: z.string().url().optional(),
  NEXTAUTH_SECRET: isProd && !isCI ? z.string().min(32) : z.string().optional(),
  NEXTAUTH_URL: isProd && !isCI ? z.string().url() : z.string().optional(),

  // Database
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),

  // Stripe (optional but validated if present)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),

  // AI Providers (optional)
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  TOGETHER_API_KEY: z.string().optional(),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

// Validate and export environment config
export function validateEnv(): EnvConfig {
  try {
    const parsed = envSchema.parse(process.env);

    // Additional security checks
    if (parsed.NODE_ENV === 'production') {
      // Ensure critical production variables are set
      if (!parsed.DATABASE_URL) {
        throw new Error('DATABASE_URL is required in production');
      }
      if (!parsed.REDIS_URL) {
        throw new Error('REDIS_URL is required in production');
      }
      if (!parsed.NEXTAUTH_SECRET || parsed.NEXTAUTH_SECRET.length < 32) {
        throw new Error('NEXTAUTH_SECRET must be at least 32 characters in production');
      }
      // Ensure we're using HTTPS in production
      if (parsed.NEXTAUTH_URL && !parsed.NEXTAUTH_URL.startsWith('https://')) {
        throw new Error('NEXTAUTH_URL must use HTTPS in production');
      }
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
    } else {
      console.error('❌ Environment validation error:', error);
    }
    // Only exit in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
}

// Export validated config (skip validation in test/build mode to avoid side effects)
export const env = (process.env.NODE_ENV === 'test' || isCI) ? {} as EnvConfig : validateEnv();

// Helper to safely get environment variables
export function getEnvVar(key: keyof EnvConfig): string | undefined {
  return env[key];
}

// Check if running in production
export const isProduction = env.NODE_ENV === 'production';

// Check if running in development
export const isDevelopment = env.NODE_ENV === 'development';