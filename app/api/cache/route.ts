import { NextRequest, NextResponse } from 'next/server';
import { getRedisCache } from '@/lib/cache/redis-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const namespace = searchParams.get('namespace');

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    const cache = getRedisCache();
    const data = await cache.get(key, { namespace: namespace || undefined });

    if (data === null) {
      return NextResponse.json(
        { error: 'Key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data }, {
      headers: {
        'Cache-Control': 'private, max-age=60',
        'X-Cache': 'HIT',
      },
    });
  } catch (error) {
    console.error('Cache GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, ttl, namespace } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const cache = getRedisCache();
    const success = await cache.set(key, value, { ttl, namespace: namespace || undefined });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to set cache' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Cache POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const namespace = searchParams.get('namespace');

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    const cache = getRedisCache();
    const success = await cache.delete(key, namespace || undefined);

    return NextResponse.json({ success }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Cache DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}