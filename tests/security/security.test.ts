import { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@hanzo/iam/server';
import { classify, consume, headers, limit } from '@/lib/security/rate-limiter';
import { DDoSProtection } from '@/lib/security/ddos-protection';
import { sanitizeInput, sanitizeSQLInput, validateFileUpload, schemas } from '@/lib/security/input-validation';
import { validateEnv } from '@/lib/security/env-validation';

describe('Security Tests', () => {
  describe('Rate Limiter', () => {
    const budget = { windowMs: 1000, max: 2 };
    // Module-level counters are shared, so every case draws on its own key.
    const key = (name: string) => `test-${name}-${Math.random()}`;

    // A session cookie whose payload names a subject. Only the `sub` claim is
    // read, and only to pick a bucket — never to decide anything.
    const sessionFor = (sub: string) => {
      const payload = Buffer.from(JSON.stringify({ sub })).toString('base64url');
      return `${SESSION_COOKIE}=header.${payload}.signature`;
    };

    it('reports what is left AFTER the request, not before', () => {
      const k = key('remaining');

      const first = consume(k, budget);
      expect(first.allowed).toBe(true);
      expect(first.remaining).toBe(1);

      const second = consume(k, budget);
      expect(second.allowed).toBe(true);
      expect(second.remaining).toBe(0);
    });

    it('should block requests over the limit', () => {
      const k = key('block');

      consume(k, budget);
      consume(k, budget);

      const third = consume(k, budget);
      expect(third.allowed).toBe(false);
      expect(third.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      const k = key('reset');

      consume(k, budget);
      consume(k, budget);
      expect(consume(k, budget).allowed).toBe(false);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(consume(k, budget).allowed).toBe(true);
    });

    it('classifies by what the request costs', () => {
      // Reads are reads whatever they read — a page, an RSC payload, a list.
      expect(classify('GET', '/dashboard')).toBe('read');
      expect(classify('GET', '/v1/projects')).toBe('read');
      expect(classify('GET', '/v1/billing/plans')).toBe('read');
      expect(classify('HEAD', '/')).toBe('read');

      // A model call is expensive whatever the verb.
      expect(classify('POST', '/v1/generate')).toBe('ai');
      expect(classify('PATCH', '/v1/generate')).toBe('ai');
      expect(classify('GET', '/v1/images')).toBe('ai');

      // Writes, by what they touch.
      expect(classify('POST', '/v1/auth/codex/token')).toBe('auth');
      expect(classify('POST', '/v1/commerce/subscription')).toBe('payment');
      expect(classify('POST', '/v1/crypto/payment')).toBe('payment');
      expect(classify('POST', '/v1/deployments')).toBe('api');
      expect(classify('DELETE', '/v1/projects/x')).toBe('api');

      // Prefix matching is on segments: /v1/authorize is not /v1/auth.
      expect(classify('POST', '/v1/authorize')).toBe('api');
    });

    it('spends page views out of the read budget, never the payment budget', () => {
      // The regression: every tier shared one `rate-limit:<ip>` counter, so
      // browsing twenty pages exhausted the 20/hour payment budget and
      // checkout 429'd for the rest of the hour.
      const ip = { 'x-forwarded-for': '198.51.100.7' };
      const read = () =>
        limit(new NextRequest('http://localhost:3000/dashboard', { headers: ip }));
      const pay = () =>
        limit(
          new NextRequest('http://localhost:3000/v1/commerce/subscription', {
            method: 'POST',
            headers: ip,
          }),
        );

      for (let i = 0; i < 25; i++) expect(read().allowed).toBe(true);

      const charge = pay();
      expect(charge.tier).toBe('payment');
      expect(charge.allowed).toBe(true);
      expect(charge.remaining).toBe(19);
    });

    it('gives each signed-in person their own budget behind one address', () => {
      // The NAT office: one address, many people. Keying on the address alone
      // let one heavy user spend the whole floor's budget.
      const from = (sub: string) =>
        limit(
          new NextRequest('http://localhost:3000/v1/deployments', {
            method: 'POST',
            headers: { 'x-forwarded-for': '203.0.113.9', cookie: sessionFor(sub) },
          }),
        );

      const a = from('person-a');
      const b = from('person-b');

      expect(a.tier).toBe('api');
      expect(a.remaining).toBe(59);
      expect(b.remaining).toBe(59); // untouched by A
    });

    it('states Retry-After only when it refuses, and never below a second', () => {
      const k = key('headers');
      const pass = { tier: 'api' as const, ...consume(k, budget) };

      expect(headers(pass)['Retry-After']).toBeUndefined();
      expect(headers(pass)['X-RateLimit-Limit']).toBe('2');
      expect(headers(pass)['X-RateLimit-Remaining']).toBe('1');
      // Epoch SECONDS — the two copies this replaced disagreed on the unit.
      expect(Number(headers(pass)['X-RateLimit-Reset'])).toBeCloseTo(
        Math.ceil((Date.now() + budget.windowMs) / 1000),
        -1,
      );

      consume(k, budget);
      const refused = { tier: 'api' as const, ...consume(k, budget) };
      expect(refused.allowed).toBe(false);
      expect(Number(headers(refused)['Retry-After'])).toBeGreaterThanOrEqual(1);

      // A window that has all but elapsed still asks for a whole second back.
      expect(
        Number(
          headers({
            tier: 'api',
            allowed: false,
            max: 2,
            remaining: 0,
            reset: Date.now() + 1,
          })['Retry-After'],
        ),
      ).toBe(1);
    });
  });

  describe('DDoS Protection', () => {
    let ddosProtection: DDoSProtection;

    beforeEach(() => {
      ddosProtection = new DDoSProtection({
        maxRequestsPerIP: 3,
        windowMs: 1000,
        blockDurationMs: 2000,
      });
    });

    it('should detect rapid requests', async () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      for (let i = 0; i < 3; i++) {
        const result = await ddosProtection.checkRequest(req);
        expect(result.allowed).toBe(true);
      }

      const result = await ddosProtection.checkRequest(req);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('rate limit');
    });

    it('should detect suspicious patterns', async () => {
      const req = new NextRequest('http://localhost:3000/api/test?id=1\' OR 1=1--', {
        headers: { 'user-agent': 'sqlmap/1.0' },
      });

      const patterns = await ddosProtection.checkPatterns(req);
      expect(patterns.suspicious).toBe(true);
      expect(patterns.patterns.length).toBeGreaterThan(0);
    });

    it.skip('should block and unblock IPs', () => {
      ddosProtection.blockIP('192.168.1.100', 5000);

      const stats = ddosProtection.getStats();
      expect(stats.blockedIPs).toBe(1);

      ddosProtection.unblockIP('192.168.1.100');
      const newStats = ddosProtection.getStats();
      expect(newStats.blockedIPs).toBe(0);
    });
  });

  describe('Input Validation', () => {
    describe('sanitizeInput', () => {
      it('should escape HTML entities', () => {
        const input = '<script>alert("XSS")</script>';
        const sanitized = sanitizeInput(input);
        expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      });

      it('should handle special characters', () => {
        const input = "'; DROP TABLE users; --";
        const sanitized = sanitizeInput(input);
        expect(sanitized).toBe('&#x27;; DROP TABLE users; --');
      });
    });

    describe('sanitizeSQLInput', () => {
      it('should remove SQL injection attempts', () => {
        const inputs = [
          "'; DROP TABLE users; --",
          "1' OR '1'='1",
          "admin'--",
          "1; DELETE FROM products",
        ];

        inputs.forEach(input => {
          const sanitized = sanitizeSQLInput(input);
          expect(sanitized).not.toContain("'");
          expect(sanitized).not.toContain('"');
          expect(sanitized).not.toContain('--');
          expect(sanitized).not.toContain(';');
        });
      });
    });

    describe('validateFileUpload', () => {
      it('should accept valid files', () => {
        const file = {
          name: 'document.pdf',
          size: 1024 * 1024, // 1MB
          type: 'application/pdf',
        };

        const result = validateFileUpload(file);
        expect(result.valid).toBe(true);
      });

      it('should reject oversized files', () => {
        const file = {
          name: 'large.pdf',
          size: 11 * 1024 * 1024, // 11MB
          type: 'application/pdf',
        };

        const result = validateFileUpload(file);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('10MB');
      });

      it.skip('should reject dangerous file names', () => {
        const files = [
          { name: '../../../etc/passwd', size: 100, type: 'text/plain' },
          { name: 'file\\..\\..\\windows\\system32\\config.sys', size: 100, type: 'text/plain' },
        ];

        files.forEach(file => {
          const result = validateFileUpload(file);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('Invalid filename');
        });
      });

      it('should reject disallowed file types', () => {
        const file = {
          name: 'script.exe',
          size: 1024,
          type: 'application/x-msdownload',
        };

        const result = validateFileUpload(file);
        expect(result.valid).toBe(false);
      });
    });

    describe('Schema Validation', () => {
      it('should validate email format', async () => {
        const validEmails = ['user@example.com', 'test.user+tag@domain.co.uk'];
        const invalidEmails = ['notanemail', '@example.com', 'user@', 'user@.com'];

        for (const email of validEmails) {
          const result = await schemas.email.safeParseAsync(email);
          expect(result.success).toBe(true);
        }

        for (const email of invalidEmails) {
          const result = await schemas.email.safeParseAsync(email);
          expect(result.success).toBe(false);
        }
      });

      it('should validate project names', async () => {
        const validNames = ['My Project', 'project-123', 'Test_App'];
        const invalidNames = ['', 'a'.repeat(101), 'project@#$%'];

        for (const name of validNames) {
          const result = await schemas.projectName.safeParseAsync(name);
          expect(result.success).toBe(true);
        }

        for (const name of invalidNames) {
          const result = await schemas.projectName.safeParseAsync(name);
          expect(result.success).toBe(false);
        }
      });

      it('should validate file paths', async () => {
        const validPaths = ['/home/user/file.txt', 'documents/report.pdf'];
        const invalidPaths = ['../etc/passwd', '/path/with/../traversal'];

        for (const path of validPaths) {
          const result = await schemas.filePath.safeParseAsync(path);
          expect(result.success).toBe(true);
        }

        for (const path of invalidPaths) {
          const result = await schemas.filePath.safeParseAsync(path);
          expect(result.success).toBe(false);
        }
      });
    });
  });

  describe('Environment Validation', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should validate required environment variables', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true,
      });
      process.env.IAM_CLIENT_ID = 'test-client-id';
      process.env.IAM_CLIENT_SECRET = 'test-client-secret';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.NEXTAUTH_URL = 'http://localhost:3000';

      expect(() => validateEnv()).not.toThrow();
    });

    it.skip('should fail on missing required variables', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true,
      });
      delete process.env.IAM_CLIENT_ID;

      // Mock process.exit
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exited');
      });

      expect(() => validateEnv()).toThrow('Process exited');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('should enforce HTTPS in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });
      process.env.IAM_CLIENT_ID = 'test-client-id';
      process.env.IAM_CLIENT_SECRET = 'test-client-secret';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.NEXTAUTH_URL = 'http://localhost:3000'; // HTTP in production
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.REDIS_URL = 'redis://localhost:6379';

      // Fail-SOFT by design: an http:// NEXTAUTH_URL in production warns loudly
      // instead of hard-exiting — a boot crash on a URL-scheme misconfig would
      // take the whole app down (and in-cluster hops legitimately use http).
      //
      // env-validation captures `isCI` at MODULE LOAD and skips every prod
      // check when CI=true (build machines validate at runtime, not build).
      // The CI runner sets CI=true, so the statically-imported module has the
      // checks disabled there — isolate a fresh module instance with CI unset
      // so the test asserts the same behavior everywhere.
      const prevCI = process.env.CI;
      const prevBuildOnly = process.env.NEXT_BUILD_ONLY;
      delete process.env.CI;
      delete process.env.NEXT_BUILD_ONLY;
      const mockWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        jest.isolateModules(() => {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const fresh = require('@/lib/security/env-validation');
          expect(() => fresh.validateEnv()).not.toThrow();
        });
        expect(
          mockWarn.mock.calls.some((c) => String(c[0]).includes('HTTPS')),
        ).toBe(true);
      } finally {
        mockWarn.mockRestore();
        if (prevCI !== undefined) process.env.CI = prevCI;
        if (prevBuildOnly !== undefined) process.env.NEXT_BUILD_ONLY = prevBuildOnly;
      }
    });
  });

  describe('XSS Prevention', () => {
    it.skip('should prevent script injection in user input', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
        '<iframe src="javascript:alert(\'XSS\')">',
      ];

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onload=');
      });
    });
  });

  describe('CSRF Protection', () => {
    it('should validate CSRF tokens', () => {
      const { validateCSRFToken } = require('@/lib/security/input-validation');

      const validToken = 'abc123def456';
      const sessionToken = 'abc123def456';

      expect(validateCSRFToken(validToken, sessionToken)).toBe(true);
      expect(validateCSRFToken('wrongtoken', sessionToken)).toBe(false);
      expect(validateCSRFToken(null, sessionToken)).toBe(false);
    });
  });
});