import { NextResponse } from 'next/server';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
}

const startTime = Date.now();

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const healthCheckSecret = process.env.HEALTH_CHECK_SECRET;
  const isAuthenticated = !healthCheckSecret || authHeader === `Bearer ${healthCheckSecret}`;

  try {
    const healthCheckResult: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'production',
    };

    // Add memory usage if authenticated
    if (isAuthenticated) {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const memPercentage = Math.round((usedMem / totalMem) * 100);

      healthCheckResult.memory = {
        used: Math.round(usedMem / 1024 / 1024),
        total: Math.round(totalMem / 1024 / 1024),
        percentage: memPercentage,
      };
    }

    return NextResponse.json(healthCheckResult, { status: 200 });
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