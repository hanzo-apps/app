import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const IAM_ENDPOINT = process.env.IAM_ENDPOINT || 'https://hanzo.id';
const OAUTH_STATE_COOKIE = 'hanzo_oauth_state';

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

  // Generate cryptographically random state to prevent CSRF
  const state = crypto.randomUUID();

  // Store state in a short-lived httpOnly cookie for validation on callback
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes — enough time to complete login
  });

  const redirectUri = `${appUrl}/api/auth/callback`;
  const authorizeUrl = new URL(`${IAM_ENDPOINT}/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid profile email');
  authorizeUrl.searchParams.set('state', state);

  return NextResponse.redirect(authorizeUrl.toString());
}

export async function POST(req: NextRequest) {
  // POST login also redirects to IAM OAuth — no local password auth
  const url = new URL(req.url);
  url.pathname = '/api/auth/login';
  return NextResponse.redirect(url.toString(), 307);
}
