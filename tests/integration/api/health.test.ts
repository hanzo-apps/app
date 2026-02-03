import { GET, HEAD } from '@/app/api/health/route';

describe('API: /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Use Object.defineProperty to modify NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      configurable: true,
    });
  });

  describe('GET', () => {
    it('returns 200 OK with health check data', async () => {
      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'healthy',
        environment: 'test',
        version: '0.1.0',
      });
      expect(data.timestamp).toBeDefined();
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });

    it('includes correct timestamp format', async () => {
      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('includes memory info when authenticated', async () => {
      process.env.HEALTH_CHECK_SECRET = 'test-secret';

      const request = new Request('http://localhost:3000/api/health', {
        headers: {
          'authorization': 'Bearer test-secret',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.memory).toBeDefined();
      expect(typeof data.memory.used).toBe('number');
      expect(typeof data.memory.total).toBe('number');
      expect(typeof data.memory.percentage).toBe('number');

      delete process.env.HEALTH_CHECK_SECRET;
    });

    it('excludes memory info when not authenticated', async () => {
      process.env.HEALTH_CHECK_SECRET = 'test-secret';

      const request = new Request('http://localhost:3000/api/health', {
        headers: {
          'authorization': 'Bearer wrong-secret',
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.memory).toBeUndefined();

      delete process.env.HEALTH_CHECK_SECRET;
    });

    it('includes memory info when no secret is configured', async () => {
      delete process.env.HEALTH_CHECK_SECRET;

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.memory).toBeDefined();
    });

    it('includes environment from NODE_ENV', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.environment).toBe('production');
    });

    it('uses default version when npm_package_version not set', async () => {
      delete process.env.npm_package_version;

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.version).toBe('0.1.0');
    });

    it('uses npm_package_version when available', async () => {
      process.env.npm_package_version = '2.0.0';

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.version).toBe('2.0.0');

      delete process.env.npm_package_version;
    });

    it('returns valid JSON response', async () => {
      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const contentType = response.headers.get('content-type');

      expect(contentType).toContain('application/json');

      // Should not throw
      await expect(response.json()).resolves.toBeDefined();
    });

    it('includes positive uptime value', async () => {
      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('HEAD', () => {
    it('returns 200 OK for liveness probe', async () => {
      const response = await HEAD();

      expect(response.status).toBe(200);
    });
  });
});
