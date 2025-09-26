import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export class RateLimiter {
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
    };
  }

  private defaultKeyGenerator(req: NextRequest): string {
    // Use IP address as default key
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
    return `rate-limit:${ip}`;
  }

  async checkLimit(req: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.config.keyGenerator(req);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const allowed = entry.count < this.config.maxRequests;

    if (allowed) {
      entry.count++;
    }

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
    };
  }

  middleware() {
    return async (req: NextRequest) => {
      const result = await this.checkLimit(req);

      if (!result.allowed) {
        return new Response('Too Many Requests', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': this.config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        });
      }

      // Add rate limit headers to successful responses
      return {
        headers: {
          'X-RateLimit-Limit': this.config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        },
      };
    };
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // Strict rate limit for authentication endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
  }),

  // Moderate rate limit for API endpoints
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  }),

  // Loose rate limit for public endpoints
  public: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute
  }),

  // Strict rate limit for AI endpoints (expensive operations)
  ai: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  }),

  // Very strict rate limit for payment endpoints
  payment: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 requests per hour
  }),
};

// Redis-backed rate limiter for production
export class RedisRateLimiter extends RateLimiter {
  private redisClient: any; // Replace with actual Redis client type

  constructor(config: RateLimitConfig, redisClient: any) {
    super(config);
    this.redisClient = redisClient;
  }

  async checkLimit(req: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    if (!this.redisClient) {
      // Fallback to in-memory if Redis is not available
      return super.checkLimit(req);
    }

    const key = (this.config as any).keyGenerator(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // Use Redis sorted set for sliding window rate limiting
      const pipeline = this.redisClient.pipeline();

      // Remove old entries
      pipeline.zremrangebyscore(key, '-inf', windowStart);

      // Count current entries
      pipeline.zcard(key);

      // Add new entry if under limit
      pipeline.zadd(key, now, `${now}-${Math.random()}`);

      // Set expiry
      pipeline.expire(key, Math.ceil(this.config.windowMs / 1000));

      const results = await pipeline.exec();
      const count = results[1][1];

      const allowed = count < this.config.maxRequests;
      const remaining = Math.max(0, this.config.maxRequests - count);
      const resetTime = now + this.config.windowMs;

      if (!allowed) {
        // Remove the entry we just added since we're over the limit
        await this.redisClient.zrem(key, `${now}-${Math.random()}`);
      }

      return {
        allowed,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      // Fallback to in-memory on error
      return super.checkLimit(req);
    }
  }
}

// Helper function for easy rate limiting in API routes
export async function applyRateLimiting(
  req: NextRequest,
  limiterName: keyof typeof rateLimiters = 'api'
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const limiter = rateLimiters[limiterName];
  const { allowed, remaining, resetTime } = await limiter.checkLimit(req);

  if (!allowed) {
    return {
      allowed: false,
      response: new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetTime: new Date(resetTime).toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetTime),
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
          },
        }
      ),
    };
  }

  return { allowed: true };
}
