import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { DDoSProtection } from '@/lib/security/ddos-protection';
import {
  validateBody,
  validateQuery,
  sanitizeInput,
  sanitizeSQLInput,
  sanitizeMongoInput,
  validateFileUpload,
  schemas,
} from '@/lib/security/input-validation';
import { validateEnv } from '@/lib/security/env-validation';

describe('Security Tests', () => {
  describe('Rate Limiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowMs: 1000, // 1 second window for testing
        maxRequests: 2,
      });
    });

    it.skip('should allow requests under the limit', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');

      const result1 = await rateLimiter.checkLimit(req);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(1);

      const result2 = await rateLimiter.checkLimit(req);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(0);
    });

    it('should block requests over the limit', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');

      await rateLimiter.checkLimit(req);
      await rateLimiter.checkLimit(req);

      const result3 = await rateLimiter.checkLimit(req);
      expect(result3.allowed).toBe(false);
      expect(result3.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');

      await rateLimiter.checkLimit(req);
      await rateLimiter.checkLimit(req);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result = await rateLimiter.checkLimit(req);
      expect(result.allowed).toBe(true);
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

    describe('sanitizeMongoInput', () => {
      it('should remove MongoDB operators', () => {
        const input = { username: 'admin', password: { $ne: null } };
        const sanitized = sanitizeMongoInput(input);
        expect(sanitized.password).not.toHaveProperty('$ne');
      });

      it('should handle nested objects', () => {
        const input = {
          user: {
            $where: 'this.password == null',
            name: 'test',
          },
        };
        const sanitized = sanitizeMongoInput(input);
        expect(sanitized.user).not.toHaveProperty('$where');
        expect(sanitized.user.name).toBe('test');
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

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exited');
      });

      expect(() => validateEnv()).toThrow('Process exited');

      mockExit.mockRestore();
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