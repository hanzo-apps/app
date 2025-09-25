import { NextRequest } from 'next/server';
import { GET } from '@/app/api/auth/check/route';
import { cookies } from 'next/headers';
import MY_TOKEN_KEY from '@/lib/get-cookie-name';

// Mock Next.js modules
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/lib/get-cookie-name', () => jest.fn(() => 'hanzo-token'));

// Mock global fetch
global.fetch = jest.fn();

describe('API: /api/auth/check', () => {
  const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

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

    it('returns 401 when token is invalid', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn(() => ({ value: 'invalid-token' })),
      } as any);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/auth/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        authenticated: false,
        message: 'Invalid token',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://huggingface.co/api/whoami-v2',
        {
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }
      );
    });

    it('returns user data when token is valid', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'testuser',
        fullname: 'Test User',
        email: 'test@example.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        otherField: 'should-be-filtered',
      };

      mockCookies.mockResolvedValue({
        get: jest.fn(() => ({ value: 'valid-token' })),
      } as any);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/auth/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        authenticated: true,
        user: {
          id: 'user-123',
          name: 'testuser',
          fullname: 'Test User',
          email: 'test@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://huggingface.co/api/whoami-v2',
        {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        }
      );
    });

    it('handles network errors gracefully', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn(() => ({ value: 'token' })),
      } as any);

      mockFetch.mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/auth/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        authenticated: false,
        message: 'Authentication check failed',
      });
    });

    it('handles malformed JSON response', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn(() => ({ value: 'token' })),
      } as any);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/auth/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        authenticated: false,
        message: 'Authentication check failed',
      });
    });

    it('makes only one API call to Hugging Face', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn(() => ({ value: 'token' })),
      } as any);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'user-123', name: 'test' }),
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/auth/check');
      await GET(request);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});