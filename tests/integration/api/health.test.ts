import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';
import { isStripeConfigured } from '@/lib/stripe';

// Mock the stripe module
jest.mock('@/lib/stripe', () => ({
  isStripeConfigured: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
  } as Response)
) as jest.Mock;

describe('API: /api/health', () => {
  const mockIsStripeConfigured = isStripeConfigured as jest.MockedFunction<typeof isStripeConfigured>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
  });

  describe('GET', () => {
    it('returns 200 OK with health check data', async () => {
      mockIsStripeConfigured.mockReturnValue(true);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'healthy',
        environment: 'test',
        version: '0.1.0',
        checks: {
          stripe: {
            status: 'pass',
            message: 'Stripe configured',
          },
        },
      });
      expect(data.timestamp).toBeDefined();
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });

    it('includes correct timestamp format', async () => {
      mockIsStripeConfigured.mockReturnValue(true);

      const response = await GET();
      const data = await response.json();

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('reports stripe as not configured when not set up', async () => {
      mockIsStripeConfigured.mockReturnValue(false);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checks.stripe).toMatchObject({
        status: 'warn',
        message: 'Stripe not configured',
      });
    });

    it('includes environment from NODE_ENV', async () => {
      process.env.NODE_ENV = 'production';
      mockIsStripeConfigured.mockReturnValue(true);

      const response = await GET();
      const data = await response.json();

      expect(data.environment).toBe('production');
    });

    it('uses default version when npm_package_version not set', async () => {
      delete process.env.npm_package_version;
      mockIsStripeConfigured.mockReturnValue(true);

      const response = await GET();
      const data = await response.json();

      expect(data.version).toBe('0.1.0');
    });

    it('uses npm_package_version when available', async () => {
      process.env.npm_package_version = '2.0.0';
      mockIsStripeConfigured.mockReturnValue(true);

      const response = await GET();
      const data = await response.json();

      expect(data.version).toBe('2.0.0');
    });

    it('returns valid JSON response', async () => {
      mockIsStripeConfigured.mockReturnValue(true);

      const response = await GET();
      const contentType = response.headers.get('content-type');

      expect(contentType).toContain('application/json');

      // Should not throw
      await expect(response.json()).resolves.toBeDefined();
    });

    it('includes positive uptime value', async () => {
      mockIsStripeConfigured.mockReturnValue(true);

      const response = await GET();
      const data = await response.json();

      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});