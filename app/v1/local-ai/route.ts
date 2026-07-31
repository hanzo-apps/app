import { NextRequest, NextResponse } from 'next/server';
import { checkHanzoDaemon, callHanzoDaemon, getHanzoDaemonStatus } from '@/lib/hanzo-daemon';

export async function GET(req: NextRequest) {
  // Check daemon status
  const isAvailable = await checkHanzoDaemon();

  if (!isAvailable) {
    return NextResponse.json({
      available: false,
      message: 'Hanzo daemon not running on port 3690. Please start hanzod or connect to desktop AI node.',
    }, { status: 503 });
  }

  const status = await getHanzoDaemonStatus();

  return NextResponse.json({
    available: true,
    status,
    message: 'Connected to local Hanzo daemon',
  });
}

export async function POST(req: NextRequest) {
  try {
    // Check if daemon is available first
    const isAvailable = await checkHanzoDaemon();

    if (!isAvailable) {
      // Fallback to cloud API if configured
      if (process.env.HANZO_CLOUD_API_URL) {
        return NextResponse.json({
          error: 'Local daemon not available, please use cloud API',
          cloudUrl: process.env.HANZO_CLOUD_API_URL,
        }, { status: 503 });
      }

      return NextResponse.json({
        error: 'Hanzo daemon not running. Start with: hanzod --port 3690',
      }, { status: 503 });
    }

    const body = await req.json();
    const { model, messages, stream, ...options } = body;

    // Call local Hanzo daemon
    const response = await callHanzoDaemon('/v1/chat/completions', {
      model: model || 'local-model',
      messages,
      stream: stream || false,
      ...options,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Local AI error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to process local AI request',
    }, { status: 500 });
  }
}