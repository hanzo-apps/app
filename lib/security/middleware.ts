import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters } from './rate-limiter';

// Security headers configuration
const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.stripe.com https://*.hanzo.ai",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' blob: data:",
    "connect-src 'self' https://*.hanzo.ai https://*.stripe.com https://api.openai.com https://api.anthropic.com wss://*.hanzo.ai",
    "frame-src 'self' https://*.stripe.com https://*.hanzo.ai",
    "frame-ancestors 'self' https://hanzo.ai https://*.hanzo.ai https://hanzo.app https://*.hanzo.app https://hanzo.bot https://*.hanzo.bot https://hanzo.team https://*.hanzo.team https://hanzo.chat https://*.hanzo.chat https://hanzo.space https://*.hanzo.space",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),

  // Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // X-Frame-Options (legacy support)
  'X-Frame-Options': 'SAMEORIGIN',

  // X-Content-Type-Options
  'X-Content-Type-Options': 'nosniff',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // X-XSS-Protection (legacy support)
  'X-XSS-Protection': '1; mode=block',

  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),

  // X-DNS-Prefetch-Control
  'X-DNS-Prefetch-Control': 'on',

  // X-Permitted-Cross-Domain-Policies
  'X-Permitted-Cross-Domain-Policies': 'none',
};

// Development-specific CSP relaxations
const devSecurityHeaders = {
  ...securityHeaders,
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: http: https:",
    "media-src 'self' blob: data:",
    "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:* https://*.hanzo.ai https://*.stripe.com",
    "frame-src 'self' http://localhost:*",
    "frame-ancestors 'self' http://localhost:*",
  ].join('; '),
};

// Apply security headers based on environment
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = process.env.NODE_ENV === 'production' ? securityHeaders : devSecurityHeaders;

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Rate limiting middleware
export async function applyRateLimiting(
  request: NextRequest,
  rateLimitType: 'auth' | 'api' | 'public' | 'ai' | 'payment' = 'api'
): Promise<NextResponse | null> {
  const limiter = rateLimiters[rateLimitType];
  const result = await limiter.checkLimit(request);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
};

// Apply CORS headers for API routes
export function applyCORSHeaders(response: NextResponse, origin?: string | null): NextResponse {
  // In production, validate origin against whitelist
  if (process.env.NODE_ENV === 'production' && origin) {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://hanzo.ai',
      'https://hanzo.app',
      'https://hanzo.io',
      'https://hanzo.bot',
      'https://hanzo.team',
      'https://hanzo.chat',
      'https://hanzo.space',
      'https://app.hanzo.bot',
      'https://chat.hanzo.ai',
      'https://console.hanzo.ai',
    ].filter(Boolean);

    // Also allow *.hanzo.ai subdomains
    if (origin && (origin.endsWith('.hanzo.ai') || origin.endsWith('.hanzo.app') || origin.endsWith('.hanzo.bot'))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      return response;
    }

    if (!allowedOrigins.includes(origin)) {
      // Don't set CORS headers for unauthorized origins
      return response;
    }

    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    // Development mode or no origin
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// Request sanitization
export function sanitizeRequest(request: NextRequest): NextRequest {
  // Clone the request to avoid modifying the original
  const sanitizedUrl = new URL(request.url);

  // Remove potentially dangerous query parameters
  const dangerousParams = ['__proto__', 'constructor', 'prototype'];
  dangerousParams.forEach((param) => {
    sanitizedUrl.searchParams.delete(param);
  });

  // Validate and sanitize path
  const path = sanitizedUrl.pathname;
  if (path.includes('..') || path.includes('//')) {
    throw new Error('Invalid path detected');
  }

  return request;
}

// IP extraction helper
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');

  if (cfIP) return cfIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;

  return 'unknown';
}

// User agent validation
export function validateUserAgent(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';

  // Block known bad user agents
  const blockedUserAgents = [
    'sqlmap', // SQL injection tool
    'nikto', // Web scanner
    'nmap', // Network scanner
    'masscan', // Port scanner
    'burpsuite', // Security testing tool
  ];

  const lowerUserAgent = userAgent.toLowerCase();
  return !blockedUserAgents.some((blocked) => lowerUserAgent.includes(blocked));
}

// Combined security middleware
export async function securityMiddleware(
  request: NextRequest,
  options?: {
    rateLimit?: 'auth' | 'api' | 'public' | 'ai' | 'payment';
    requireAuth?: boolean;
    validateUA?: boolean;
  }
): Promise<NextResponse | null> {
  try {
    // Validate user agent if required
    if (options?.validateUA && !validateUserAgent(request)) {
      return NextResponse.json({ error: 'Invalid user agent' }, { status: 403 });
    }

    // Apply rate limiting
    if (options?.rateLimit) {
      const rateLimitResponse = await applyRateLimiting(request, options.rateLimit);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }

    // Check authentication if required
    if (options?.requireAuth) {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      // Additional token validation would go here
    }

    return null; // Continue with request processing
  } catch (error) {
    console.error('Security middleware error:', error);
    return NextResponse.json({ error: 'Security check failed' }, { status: 500 });
  }
}

// Export all security utilities
export const security = {
  applySecurityHeaders,
  applyRateLimiting,
  applyCORSHeaders,
  sanitizeRequest,
  getClientIP,
  validateUserAgent,
  securityMiddleware,
};