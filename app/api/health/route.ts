import { NextResponse } from 'next/server';
import { isStripeConfigured } from '@/lib/stripe';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      responseTime?: number;
      metadata?: Record<string, unknown>;
    };
  };
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
}

const startTime = Date.now();

async function checkStripe(): Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string }> {
  try {
    const configured = isStripeConfigured();
    if (configured) {
      return { status: 'pass', message: 'Stripe configured' };
    } else {
      return { status: 'warn', message: 'Stripe not configured' };
    }
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Stripe check failed',
    };
  }
}

async function checkExternalAPI(): Promise<{ status: 'pass' | 'fail' | 'warn'; responseTime: number; message?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - start;

    if (response.ok) {
      return { status: 'pass', responseTime };
    } else if (response.status >= 500) {
      return {
        status: 'warn',
        responseTime,
        message: `External API returned ${response.status}`,
      };
    } else {
      return {
        status: 'fail',
        responseTime,
        message: `External API returned ${response.status}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - start;
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 'warn',
        responseTime,
        message: 'External API check timed out',
      };
    }
    return {
      status: 'fail',
      responseTime,
      message: error instanceof Error ? error.message : 'External API check failed',
    };
  }
}

export async function GET(request?: Request) {
  const authHeader = request?.headers.get('authorization');

  // Basic authentication for detailed health checks
  const healthCheckSecret = process.env.HEALTH_CHECK_SECRET;
  const isAuthenticated = !healthCheckSecret || authHeader === `Bearer ${healthCheckSecret}`;

  try {
    // Run health checks in parallel
    const [stripeCheck, apiCheck] = await Promise.allSettled([
      checkStripe(),
      checkExternalAPI(),
    ]);

    const checks: HealthCheckResult['checks'] = {};

    // Process Stripe check
    if (stripeCheck.status === 'fulfilled') {
      checks.stripe = stripeCheck.value;
    } else {
      checks.stripe = {
        status: 'fail',
        message: 'Stripe check failed to execute',
      };
    }

    // Process external API check (only if authenticated)
    if (isAuthenticated) {
      if (apiCheck.status === 'fulfilled') {
        checks.externalApi = apiCheck.value;
      } else {
        checks.externalApi = {
          status: 'fail',
          message: 'External API check failed to execute',
        };
      }
    }

    // Calculate overall status
    const failedChecks = Object.values(checks).filter((check) => check.status === 'fail');
    const warnChecks = Object.values(checks).filter((check) => check.status === 'warn');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks.length > 0) {
      overallStatus = 'unhealthy';
    } else if (warnChecks.length > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    // Build response
    const healthCheckResult: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'production',
      checks,
    };

    // Add memory usage if authenticated
    if (isAuthenticated) {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const memPercentage = Math.round((usedMem / totalMem) * 100);

      healthCheckResult.memory = {
        used: Math.round(usedMem / 1024 / 1024), // in MB
        total: Math.round(totalMem / 1024 / 1024), // in MB
        percentage: memPercentage,
      };
    }

    const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;
    return NextResponse.json(healthCheckResult, { status: httpStatus });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
}

// Liveness probe - simple check that the application is running
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}