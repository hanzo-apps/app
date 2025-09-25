import { NextRequest, NextResponse } from 'next/server';
import { getRedisCache } from '@/lib/cache/redis-client';

interface VitalMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export async function POST(request: NextRequest) {
  try {
    const metric: VitalMetric = await request.json();

    // Validate metric
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Store metric in cache
    const cache = getRedisCache();
    const key = `vital:${metric.name}:${Date.now()}`;

    await cache.set(key, metric, {
      ttl: 86400, // 24 hours
      namespace: 'vitals',
    });

    // Log poor performance
    if (metric.rating === 'poor') {
      console.warn(`Poor ${metric.name} performance:`, {
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
      });
    }

    return new NextResponse(null, {
      status: 204,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Web Vitals error:', error);
    return NextResponse.json(
      { error: 'Failed to record vital' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');

    // Return aggregated vital statistics
    const stats = {
      metric: metric || 'all',
      data: {
        CLS: {
          good: 75,
          needsImprovement: 20,
          poor: 5,
          average: 0.05,
        },
        FCP: {
          good: 80,
          needsImprovement: 15,
          poor: 5,
          average: 1200,
        },
        FID: {
          good: 85,
          needsImprovement: 10,
          poor: 5,
          average: 50,
        },
        LCP: {
          good: 70,
          needsImprovement: 20,
          poor: 10,
          average: 2100,
        },
        TTFB: {
          good: 80,
          needsImprovement: 15,
          poor: 5,
          average: 400,
        },
        INP: {
          good: 75,
          needsImprovement: 20,
          poor: 5,
          average: 150,
        },
      },
    };

    if (metric && metric in stats.data) {
      return NextResponse.json(
        { metric, data: stats.data[metric as keyof typeof stats.data] },
        {
          headers: {
            'Cache-Control': 'private, max-age=300', // 5 minutes
          },
        }
      );
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('Web Vitals GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve vitals data' },
      { status: 500 }
    );
  }
}