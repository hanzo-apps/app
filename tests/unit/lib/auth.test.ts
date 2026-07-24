import { isAuthenticated, tokenMintedForApp } from '@/lib/auth';
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
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      configurable: true,
    });
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
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true,
      });

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true,
      });

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });
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

  // FIX #2: only a token minted for hanzo.app's OWN IAM client may elevate to a
  // global-admin direct-commit. tokenMintedForApp is the aud/azp/token_use guard.
  describe('tokenMintedForApp', () => {
    // An UNSIGNED JWT (`header.payload.sig`) — tokenMintedForApp/decodeJwt only
    // reads the claims (audience binding is an authorization decision layered on
    // top of the userinfo liveness check, not a signature verification here).
    const jwt = (payload: Record<string, unknown>): string => {
      const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
      return `${b64({ alg: 'none', typ: 'JWT' })}.${b64(payload)}.sig`;
    };

    beforeEach(() => {
      process.env.IAM_CLIENT_ID = 'hanzo-app';
    });

    it('accepts a token whose aud (string) is our client', () => {
      expect(tokenMintedForApp(jwt({ aud: 'hanzo-app', owner: 'admin' }))).toBe(true);
    });

    it('accepts a token whose aud (array) includes our client', () => {
      expect(tokenMintedForApp(jwt({ aud: ['other', 'hanzo-app'] }))).toBe(true);
    });

    it('accepts a token whose azp is our client', () => {
      expect(tokenMintedForApp(jwt({ aud: 'someone-else', azp: 'hanzo-app' }))).toBe(true);
    });

    it('REJECTS a token minted for a different (lower-trust) app', () => {
      expect(tokenMintedForApp(jwt({ aud: 'hanzo-chat', owner: 'admin' }))).toBe(false);
    });

    it('REJECTS when token_use is present and not an access token', () => {
      expect(tokenMintedForApp(jwt({ aud: 'hanzo-app', token_use: 'id' }))).toBe(false);
    });

    it('fails closed for an opaque / non-JWT token', () => {
      expect(tokenMintedForApp('not-a-jwt')).toBe(false);
    });

    it('fails closed when no IAM_CLIENT_ID is configured', () => {
      delete process.env.IAM_CLIENT_ID;
      expect(tokenMintedForApp(jwt({ aud: 'hanzo-app' }))).toBe(false);
    });
  });
});