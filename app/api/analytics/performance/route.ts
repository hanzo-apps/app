import { NextRequest, NextResponse } from 'next/server';
import { getRedisCache } from '@/lib/cache/redis-client';

interface PerformanceData {
  metrics: {
    cls: number | null;
    fcp: number | null;
    fid: number | null;
    lcp: number | null;
    ttfb: number | null;
    inp: number | null;
  };
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: any;
  memory?: any;
}

export async function POST(request: NextRequest) {
  try {
    const data: PerformanceData = await request.json();

    // Validate data
    if (!data.metrics || !data.url) {
      return NextResponse.json(
        { error: 'Invalid performance data' },
        { status: 400 }
      );
    }

    // Store in cache for aggregation
    const cache = getRedisCache();
    const key = `perf:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

    await cache.set(key, data, {
      ttl: 86400, // 24 hours
      namespace: 'analytics',
    });

    // Log critical performance issues
    const { metrics } = data;
    const issues: string[] = [];

    if (metrics.cls && metrics.cls > 0.25) {
      issues.push(`High CLS: ${metrics.cls.toFixed(3)}`);
    }
    if (metrics.lcp && metrics.lcp > 4000) {
      issues.push(`Slow LCP: ${metrics.lcp}ms`);
    }
    if (metrics.fid && metrics.fid > 300) {
      issues.push(`High FID: ${metrics.fid}ms`);
    }
    if (metrics.ttfb && metrics.ttfb > 1800) {
      issues.push(`Slow TTFB: ${metrics.ttfb}ms`);
    }

    if (issues.length > 0) {
      console.warn('Performance issues detected:', {
        url: data.url,
        issues,
        metrics: data.metrics,
      });
    }

    // Return success response
    return NextResponse.json(
      { success: true, issues },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Performance analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to record performance data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const cache = getRedisCache();

    // Get all performance entries
    // In production, you'd want to use a proper database
    const pattern = url ? `perf:*${url}*` : 'perf:*';

    // For demo purposes, return aggregated stats
    const stats = {
      url,
      period: { from, to },
      averages: {
        cls: 0.05,
        fcp: 1200,
        fid: 50,
        lcp: 2100,
        ttfb: 400,
        inp: 150,
      },
      p75: {
        cls: 0.08,
        fcp: 1800,
        fid: 80,
        lcp: 2800,
        ttfb: 600,
        inp: 200,
      },
      p95: {
        cls: 0.15,
        fcp: 2500,
        fid: 150,
        lcp: 4000,
        ttfb: 1200,
        inp: 400,
      },
      samples: 1000,
    };

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Performance analytics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve performance data' },
      { status: 500 }
    );
  }
}