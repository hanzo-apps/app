import { NextRequest } from 'next/server';

interface DDoSConfig {
  maxRequestsPerIP: number;
  windowMs: number;
  blockDurationMs: number;
  maxConnectionsPerIP: number;
  enableFingerprinting: boolean;
}

interface ConnectionInfo {
  count: number;
  firstSeen: number;
  lastSeen: number;
  requestCount: number;
  fingerprint?: string;
  blocked?: boolean;
  blockUntil?: number;
}

// Connection tracking
const connections = new Map<string, ConnectionInfo>();
const blockedIPs = new Set<string>();

// Clean up old connections periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of connections.entries()) {
    // Remove connections older than 1 hour
    if (now - info.lastSeen > 3600000) {
      connections.delete(ip);
    }
    // Remove expired blocks
    if (info.blocked && info.blockUntil && info.blockUntil < now) {
      info.blocked = false;
      blockedIPs.delete(ip);
    }
  }
}, 60000); // Every minute

export class DDoSProtection {
  private config: DDoSConfig;

  constructor(config: Partial<DDoSConfig> = {}) {
    this.config = {
      maxRequestsPerIP: config.maxRequestsPerIP || 100,
      windowMs: config.windowMs || 60000, // 1 minute
      blockDurationMs: config.blockDurationMs || 300000, // 5 minutes
      maxConnectionsPerIP: config.maxConnectionsPerIP || 10,
      enableFingerprinting: config.enableFingerprinting !== false,
    };
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfIP = request.headers.get('cf-connecting-ip');

    if (cfIP) return cfIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    if (realIP) return realIP;

    return 'unknown';
  }

  private generateFingerprint(request: NextRequest): string {
    // Create a fingerprint based on request characteristics
    const userAgent = request.headers.get('user-agent') || '';
    const acceptLanguage = request.headers.get('accept-language') || '';
    const acceptEncoding = request.headers.get('accept-encoding') || '';
    const dnt = request.headers.get('dnt') || '';

    return `${userAgent}|${acceptLanguage}|${acceptEncoding}|${dnt}`;
  }

  async checkRequest(request: NextRequest): Promise<{
    allowed: boolean;
    reason?: string;
    blockDuration?: number;
  }> {
    const ip = this.getClientIP(request);
    const now = Date.now();

    // Check if IP is blocked
    if (blockedIPs.has(ip)) {
      const info = connections.get(ip);
      if (info?.blockUntil && info.blockUntil > now) {
        return {
          allowed: false,
          reason: 'IP temporarily blocked due to suspicious activity',
          blockDuration: info.blockUntil - now,
        };
      }
    }

    // Get or create connection info
    let info = connections.get(ip);
    if (!info) {
      info = {
        count: 1,
        firstSeen: now,
        lastSeen: now,
        requestCount: 1,
      };
      connections.set(ip, info);
    } else {
      info.count++;
      info.lastSeen = now;
      info.requestCount++;
    }

    // Generate fingerprint if enabled
    if (this.config.enableFingerprinting) {
      const fingerprint = this.generateFingerprint(request);
      if (info.fingerprint && info.fingerprint !== fingerprint) {
        // Fingerprint changed - possible attack
        console.warn(`Fingerprint mismatch for IP ${ip}`);
      }
      info.fingerprint = fingerprint;
    }

    // Check request rate within window
    const windowStart = now - this.config.windowMs;
    if (info.firstSeen > windowStart) {
      if (info.requestCount > this.config.maxRequestsPerIP) {
        // Block the IP
        info.blocked = true;
        info.blockUntil = now + this.config.blockDurationMs;
        blockedIPs.add(ip);

        return {
          allowed: false,
          reason: 'Request rate limit exceeded',
          blockDuration: this.config.blockDurationMs,
        };
      }
    } else {
      // Reset counter for new window
      info.firstSeen = now;
      info.requestCount = 1;
    }

    // Check concurrent connections
    const activeConnections = Array.from(connections.values()).filter(
      (conn) => conn.lastSeen > now - 5000 // Active in last 5 seconds
    ).length;

    if (activeConnections > this.config.maxConnectionsPerIP * 10) {
      // System-wide connection limit
      return {
        allowed: false,
        reason: 'System under high load',
      };
    }

    return { allowed: true };
  }

  // Additional protection methods
  async checkPatterns(request: NextRequest): Promise<{
    suspicious: boolean;
    patterns: string[];
  }> {
    const patterns: string[] = [];
    const url = new URL(request.url);
    const path = url.pathname;
    const userAgent = request.headers.get('user-agent') || '';

    // Check for common attack patterns
    const suspiciousPatterns = [
      // SQL injection attempts
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /(\%3D)|(=)/i,
      /union.*select/i,
      /insert.*into/i,
      /drop.*table/i,

      // XSS attempts
      /<script[^>]*>.*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,

      // Path traversal
      /\.\.\//g,
      /\.\.\\/,

      // Command injection
      /;\s*(ls|cat|wget|curl|bash|sh|cmd|powershell)/i,
      /\||\s*(ls|cat|wget|curl|bash|sh|cmd|powershell)/i,

      // Common vulnerability scanners
      /nikto|sqlmap|nmap|masscan|burp/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(path) || pattern.test(url.search) || pattern.test(userAgent)) {
        patterns.push(pattern.source);
      }
    }

    // Check for rapid automated requests
    const ip = this.getClientIP(request);
    const info = connections.get(ip);
    if (info && info.requestCount > 50 && (info.lastSeen - info.firstSeen) < 1000) {
      patterns.push('Rapid automated requests detected');
    }

    return {
      suspicious: patterns.length > 0,
      patterns,
    };
  }

  // Get current system stats
  getStats(): {
    activeConnections: number;
    blockedIPs: number;
    totalConnections: number;
  } {
    const now = Date.now();
    const activeConnections = Array.from(connections.values()).filter(
      (conn) => conn.lastSeen > now - 60000 // Active in last minute
    ).length;

    return {
      activeConnections,
      blockedIPs: blockedIPs.size,
      totalConnections: connections.size,
    };
  }

  // Manually block an IP
  blockIP(ip: string, duration: number = 3600000): void {
    blockedIPs.add(ip);
    const info = connections.get(ip) || {
      count: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      requestCount: 0,
    };
    info.blocked = true;
    info.blockUntil = Date.now() + duration;
    connections.set(ip, info);
  }

  // Manually unblock an IP
  unblockIP(ip: string): void {
    blockedIPs.delete(ip);
    const info = connections.get(ip);
    if (info) {
      info.blocked = false;
      info.blockUntil = undefined;
    }
  }
}

// Pre-configured DDoS protection instances
export const ddosProtection = {
  // Standard protection for most endpoints
  standard: new DDoSProtection({
    maxRequestsPerIP: 100,
    windowMs: 60000,
    blockDurationMs: 300000,
    maxConnectionsPerIP: 10,
  }),

  // Strict protection for sensitive endpoints
  strict: new DDoSProtection({
    maxRequestsPerIP: 20,
    windowMs: 60000,
    blockDurationMs: 1800000, // 30 minutes
    maxConnectionsPerIP: 5,
  }),

  // Relaxed protection for public assets
  relaxed: new DDoSProtection({
    maxRequestsPerIP: 500,
    windowMs: 60000,
    blockDurationMs: 60000, // 1 minute
    maxConnectionsPerIP: 20,
  }),
};

// Middleware function
export async function ddosMiddleware(
  request: NextRequest,
  level: 'standard' | 'strict' | 'relaxed' = 'standard'
): Promise<{ allowed: boolean; reason?: string }> {
  const protection = ddosProtection[level];

  // Check basic DDoS protection
  const result = await protection.checkRequest(request);
  if (!result.allowed) {
    return result;
  }

  // Check for attack patterns
  const patterns = await protection.checkPatterns(request);
  if (patterns.suspicious) {
    console.warn(`Suspicious patterns detected: ${patterns.patterns.join(', ')}`);

    // Block IP if multiple patterns detected
    if (patterns.patterns.length > 2) {
      const ip = protection['getClientIP'](request);
      protection.blockIP(ip, 3600000); // Block for 1 hour
      return {
        allowed: false,
        reason: 'Suspicious activity detected',
      };
    }
  }

  return { allowed: true };
}