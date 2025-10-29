import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { validateBody, validateQuery } from './input-validation';
import { applyRateLimiting } from './rate-limiter';
import { ddosMiddleware } from './ddos-protection';
import { getClientIP } from './middleware';

interface ApiHandlerOptions {
  // Validation schemas
  bodySchema?: ZodSchema;
  querySchema?: ZodSchema;

  // Security options
  rateLimit?: 'auth' | 'api' | 'public' | 'ai' | 'payment';
  ddosProtection?: 'standard' | 'strict' | 'relaxed';
  requireAuth?: boolean;
  requireAdmin?: boolean;

  // Logging
  logRequests?: boolean;
  logErrors?: boolean;
}

interface User {
  id: string;
  isAdmin?: boolean;
  email?: string;
  [key: string]: any;
}

interface ApiContext {
  request: NextRequest;
  body?: any;
  query?: any;
  user?: User | null;
  ip: string;
}

type ApiHandler = (context: ApiContext) => Promise<NextResponse>;

// Security audit logging
function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    level,
    ...details,
  };

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, DataDog, etc.
    console.log('[SECURITY]', JSON.stringify(logEntry));
  } else {
    console.log('[SECURITY]', logEntry);
  }
}

// Create a secure API endpoint wrapper
export function secureApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const ip = getClientIP(req);

    try {
      // 1. DDoS Protection
      if (options.ddosProtection) {
        const ddosResult = await ddosMiddleware(req, options.ddosProtection);
        if (!ddosResult.allowed) {
          logSecurityEvent('ddos_blocked', {
            ip,
            reason: ddosResult.reason,
            path: req.nextUrl.pathname,
          }, 'warn');

          return NextResponse.json(
            { error: 'Too many requests from your IP address' },
            { status: 429 }
          );
        }
      }

      // 2. Rate Limiting
      if (options.rateLimit) {
        const rateLimitResult = await applyRateLimiting(req, options.rateLimit);
        if (!rateLimitResult.allowed && rateLimitResult.response) {
          logSecurityEvent('rate_limit_exceeded', {
            ip,
            endpoint: req.nextUrl.pathname,
            limit: options.rateLimit,
          }, 'warn');
          return rateLimitResult.response;
        }
      }

      // 3. Authentication Check
      let user: User | null = null;
      if (options.requireAuth) {
        const authHeader = req.headers.get('authorization');
        const sessionToken = req.cookies.get('session-token')?.value;

        if (!authHeader && !sessionToken) {
          logSecurityEvent('auth_missing', {
            ip,
            path: req.nextUrl.pathname,
          });
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Validate token (implement your auth logic here)
        // user = await validateToken(authHeader || sessionToken);
        // if (!user) {
        //   return NextResponse.json(
        //     { error: 'Invalid authentication token' },
        //     { status: 401 }
        //   );
        // }
      }

      // 4. Admin Check
      if (options.requireAdmin && user) {
        // Check if user has admin privileges
        // if (!user.isAdmin) {
        //   logSecurityEvent('admin_access_denied', {
        //     ip,
        //     userId: user.id,
        //     path: req.nextUrl.pathname,
        //   }, 'warn');
        //   return NextResponse.json(
        //     { error: 'Admin access required' },
        //     { status: 403 }
        //   );
        // }
      }

      // 5. Input Validation
      const context: ApiContext = {
        request: req,
        user,
        ip,
      };

      // Validate request body
      if (options.bodySchema && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyValidation = await validateBody(req, options.bodySchema);
        if (!bodyValidation.success) {
          logSecurityEvent('validation_failed', {
            ip,
            path: req.nextUrl.pathname,
            errors: (bodyValidation as { success: false; errors: string[] }).errors,
          });
          return NextResponse.json(
            { error: 'Invalid request data', errors: (bodyValidation as { success: false; errors: string[] }).errors },
            { status: 400 }
          );
        }
        context.body = (bodyValidation as { success: true; data: any }).data;
      }

      // Validate query parameters
      if (options.querySchema) {
        const queryValidation = validateQuery(
          req.nextUrl.searchParams,
          options.querySchema
        );
        if (!queryValidation.success) {
          logSecurityEvent('query_validation_failed', {
            ip,
            path: req.nextUrl.pathname,
            errors: (queryValidation as { success: false; errors: string[] }).errors,
          });
          return NextResponse.json(
            { error: 'Invalid query parameters', errors: (queryValidation as { success: false; errors: string[] }).errors },
            { status: 400 }
          );
        }
        context.query = (queryValidation as { success: true; data: any }).data;
      }

      // 6. Log Request (if enabled)
      if (options.logRequests) {
        logSecurityEvent('api_request', {
          ip,
          method: req.method,
          path: req.nextUrl.pathname,
          userId: (user as User | null)?.id,
        });
      }

      // 7. Execute Handler
      const response = await handler(context);

      // 8. Add Security Headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      // 9. Log Response Time
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        logSecurityEvent('slow_request', {
          ip,
          path: req.nextUrl.pathname,
          duration,
        }, 'warn');
      }

      return response;
    } catch (error) {
      // Error Handling
      const errorId = crypto.randomUUID();

      if (options.logErrors) {
        logSecurityEvent('api_error', {
          errorId,
          ip,
          path: req.nextUrl.pathname,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        }, 'error');
      }

      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          {
            error: 'An error occurred processing your request',
            errorId,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Internal server error',
          errorId,
        },
        { status: 500 }
      );
    }
  };
}

// Helper function for creating standard API responses
export function apiResponse<T>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(
    { success: true, data },
    { status }
  );

  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// Helper function for creating error responses
export function apiError(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}