import { z } from 'zod';

// Define strict environment variable schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Authentication
  HF_CLIENT_ID: z.string().min(1),
  HF_CLIENT_SECRET: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),

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
      if (parsed.NEXTAUTH_SECRET.length < 32) {
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
    process.exit(1);
  }
}

// Export validated config
export const env = validateEnv();

// Helper to safely get environment variables
export function getEnvVar(key: keyof EnvConfig): string | undefined {
  return env[key];
}

// Check if running in production
export const isProduction = env.NODE_ENV === 'production';

// Check if running in development
export const isDevelopment = env.NODE_ENV === 'development';