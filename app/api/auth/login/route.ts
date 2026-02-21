import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simple auth - for now use env-based admin credentials
// In production, this should use a proper user database
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@hanzo.ai';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'hanzo2024!';

export async function GET(req: NextRequest) {
  // Return login page info - no external OAuth redirect needed
  return NextResponse.json({
    method: 'email',
    message: 'Use POST with email and password to login'
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Simple auth check - in production use proper hashing and DB
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Create a simple session token
      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

      const cookieStore = await cookies();
      cookieStore.set('hanzo_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return NextResponse.json({
        success: true,
        user: {
          id: 'admin',
          email: email,
          fullname: 'Admin',
          name: 'Admin',
          avatarUrl: '',
          isPro: true,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
