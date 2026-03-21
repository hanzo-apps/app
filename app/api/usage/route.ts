import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/session';

export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Mock usage data - replace with Hanzo Commerce API
    const usage = {
      api_calls: {
        used: Math.floor(Math.random() * 500) + 400, // 400-900
        limit: 10000,
        period: 'monthly'
      },
      ai_responses: {
        used: Math.floor(Math.random() * 100) + 50, // 50-150
        limit: 1000,
        period: 'monthly'
      },
      storage: {
        used: parseFloat((Math.random() * 5 + 1).toFixed(1)), // 1-6 GB
        limit: 100,
        unit: 'GB',
        period: 'monthly'
      },
      projects: {
        used: Math.floor(Math.random() * 8) + 3, // 3-10
        limit: 50,
        period: 'account'
      },
      bandwidth: {
        used: parseFloat((Math.random() * 20 + 5).toFixed(1)), // 5-25 GB
        limit: 500,
        unit: 'GB',
        period: 'monthly'
      }
    };

    return NextResponse.json({ usage });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { event, metadata } = await req.json();

    // In production, save to database
    // await trackUsageEvent(user.id, event, metadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}