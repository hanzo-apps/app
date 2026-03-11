import { NextRequest, NextResponse } from 'next/server';

const IAM_ENDPOINT = process.env.IAM_ENDPOINT || 'https://hanzo.id';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const clientId = process.env.NEXT_PUBLIC_IAM_CLIENT_ID || process.env.IAM_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: 'OAuth configuration missing (IAM_CLIENT_ID)' },
      { status: 500 },
    );
  }

  const redirectUri = `${appUrl}/api/auth/callback`;
  const authorizeUrl = new URL(`${IAM_ENDPOINT}/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid profile email');
  authorizeUrl.searchParams.set('state', crypto.randomUUID());

  return NextResponse.redirect(authorizeUrl.toString());
}

export async function POST(req: NextRequest) {
  // POST login also redirects to IAM OAuth — no local password auth
  const url = new URL(req.url);
  url.pathname = '/api/auth/login';
  return NextResponse.redirect(url.toString(), 307);
}
