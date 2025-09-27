import { isAuthenticated } from '@/lib/auth';
import { cookies, headers } from 'next/headers';
import MY_TOKEN_KEY from '@/lib/get-cookie-name';

// Mock Next.js functions
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}));

jest.mock('@/lib/get-cookie-name', () => jest.fn(() => 'hanzo-token'));

describe('Auth', () => {
  const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
  const mockHeaders = headers as jest.MockedFunction<typeof headers>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.LOCAL_API_KEY = 'test-api-key';
  });

  describe('isAuthenticated', () => {
    it('returns undefined when no authentication is present', async () => {
      delete process.env.LOCAL_API_KEY;

      mockHeaders.mockResolvedValue({
        get: jest.fn((key) => {
          if (key === 'host') return 'example.com';
          return null;
        }),
      } as any);

      mockCookies.mockResolvedValue({
        get: jest.fn(() => undefined),
      } as any);

      const result = await isAuthenticated();
      expect(result).toBeUndefined();
    });

    it('returns local dev user for localhost in development', async () => {
      process.env.NODE_ENV = 'development';

      mockHeaders.mockResolvedValue({
        get: jest.fn((key) => {
          if (key === 'host') return 'localhost:3000';
          return null;
        }),
      } as any);

      mockCookies.mockResolvedValue({
        get: jest.fn(() => undefined),
      } as any);

      const result = await isAuthenticated();
      expect(result).toEqual({
        id: 'local-dev-user',
        name: 'Local Developer',
        fullname: 'Local Development User',
        avatarUrl: '',
        isPro: true,
        isLocalUse: true,
        token: 'local-dev-token',
      });
    });

    it('returns API user when valid local API key is provided', async () => {
      mockHeaders.mockResolvedValue({
        get: jest.fn((key) => {
          if (key === 'host') return 'example.com';
          if (key === 'X-Local-API-Key') return 'test-api-key';
          return null;
        }),
      } as any);

      mockCookies.mockResolvedValue({
        get: jest.fn(() => undefined),
      } as any);

      const result = await isAuthenticated();
      expect(result).toEqual({
        id: 'api-user',
        name: 'API User',
        fullname: 'Hanzo API User',
        avatarUrl: '',
        isPro: true,
        isLocalUse: true,
        token: 'test-api-key',
      });
    });

    it('detects localhost from origin header', async () => {
      process.env.NODE_ENV = 'development';

      mockHeaders.mockResolvedValue({
        get: jest.fn((key) => {
          if (key === 'host') return 'example.com';
          if (key === 'origin') return 'http://127.0.0.1:3000';
          return null;
        }),
      } as any);

      mockCookies.mockResolvedValue({
        get: jest.fn(() => undefined),
      } as any);

      const result = await isAuthenticated();
      expect(result?.isLocalUse).toBe(true);
    });

    it('does not return local user for localhost in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOCAL_API_KEY;

      mockHeaders.mockResolvedValue({
        get: jest.fn((key) => {
          if (key === 'host') return 'localhost:3000';
          return null;
        }),
      } as any);

      mockCookies.mockResolvedValue({
        get: jest.fn(() => undefined),
      } as any);

      const result = await isAuthenticated();
      expect(result).toBeUndefined();
    });

    it('rejects invalid API key', async () => {
      mockHeaders.mockResolvedValue({
        get: jest.fn((key) => {
          if (key === 'host') return 'example.com';
          if (key === 'X-Local-API-Key') return 'invalid-key';
          return null;
        }),
      } as any);

      mockCookies.mockResolvedValue({
        get: jest.fn(() => undefined),
      } as any);

      const result = await isAuthenticated();
      expect(result).toBeUndefined();
    });
  });
});