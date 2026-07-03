import { NextRequest } from 'next/server';
import { GET } from '@/app/api/auth/check/route';
import { cookies } from 'next/headers';

// Mock Next.js modules
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('API: /api/auth/check', () => {
  const mockCookies = cookies as jest.MockedFunction<typeof cookies>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 when no token is present', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn(() => undefined),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        authenticated: false,
        message: 'No token found',
      });
    });

    it('returns 401 when token format is invalid', async () => {
      // Token without proper email:timestamp format
      mockCookies.mockResolvedValue({
        get: jest.fn(() => ({ value: 'invalid-token-format' })),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        authenticated: false,
        message: 'Invalid token format',
      });
    });

    it('returns 401 when token is malformed base64', async () => {
      // Base64 encoded string without colon separator
      const malformedToken = Buffer.from('no-colon-separator').toString('base64');
      mockCookies.mockResolvedValue({
        get: jest.fn(() => ({ value: malformedToken })),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        authenticated: false,
        message: 'Invalid token format',
      });
    });

    it('returns user data when token is valid', async () => {
      // Create a valid base64 token (email:timestamp)
      const timestamp = Date.now().toString();
      const email = 'test@example.com';
      const validToken = Buffer.from(`${email}:${timestamp}`).toString('base64');

      mockCookies.mockResolvedValue({
        get: jest.fn(() => ({ value: validToken })),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.user).toMatchObject({
        id: 'admin',
        name: 'Admin',
        fullname: 'Admin',
        email: email,
        isPro: true,
      });
    });

    it('returns 401 when token is expired', async () => {
      // Create a token with an old timestamp (8 days ago)
      const oldTimestamp = (Date.now() - 8 * 24 * 60 * 60 * 1000).toString();
      const email = 'test@example.com';
      const expiredToken = Buffer.from(`${email}:${oldTimestamp}`).toString('base64');

      mockCookies.mockResolvedValue({
        get: jest.fn(() => ({ value: expiredToken })),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        authenticated: false,
        message: 'Token expired',
      });
    });

    it('does not make external API calls', async () => {
      // The auth check uses local token validation, not external API
      const mockFetch = jest.spyOn(global, 'fetch');

      const timestamp = Date.now().toString();
      const validToken = Buffer.from(`test@example.com:${timestamp}`).toString('base64');

      mockCookies.mockResolvedValue({
        get: jest.fn(() => ({ value: validToken })),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/auth/check');
      await GET(request);

      // No fetch calls should be made - auth is done locally
      expect(mockFetch).not.toHaveBeenCalled();

      mockFetch.mockRestore();
    });
  });
});
