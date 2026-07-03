import { createClient, RedisClientType } from 'redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
}

class RedisCache {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = this.connect();
    return this.connectionPromise;
  }

  private async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('ready', () => {
        console.log('Redis client connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  private buildKey(key: string, namespace?: string): string {
    const prefix = namespace || 'hanzo';
    return `${prefix}:${key}`;
  }

  async get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.isConnected || !this.client) return null;

    try {
      const fullKey = this.buildKey(key, options?.namespace);
      const data = await this.client.get(fullKey);

      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T = any>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;

    try {
      const fullKey = this.buildKey(key, options?.namespace);
      const serialized = JSON.stringify(value);

      if (options?.ttl) {
        await this.client.setEx(fullKey, options.ttl, serialized);
      } else {
        await this.client.set(fullKey, serialized);
      }

      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async delete(key: string, namespace?: string): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;

    try {
      const fullKey = this.buildKey(key, namespace);
      const result = await this.client.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async flush(namespace?: string): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;

    try {
      const pattern = this.buildKey('*', namespace);
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(keys);
      }

      return true;
    } catch (error) {
      console.error('Redis flush error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
    }
  }
}

// Singleton instance
let cacheInstance: RedisCache | null = null;

export function getRedisCache(): RedisCache {
  if (!cacheInstance) {
    cacheInstance = new RedisCache();
  }
  return cacheInstance;
}

// Helper functions for common caching patterns
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const cache = getRedisCache();

  // Try to get from cache first
  const cached = await cache.get<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const fresh = await fetcher();

  // Store in cache
  await cache.set(key, fresh, options);

  return fresh;
}

// Stale-while-revalidate pattern
export async function swrCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions & { staleTime?: number }
): Promise<T> {
  const cache = getRedisCache();
  const staleKey = `${key}:stale`;

  // Get cached data
  const cached = await cache.get<T>(key, options);

  if (cached !== null) {
    // Check if stale
    const staleTimestamp = await cache.get<number>(staleKey, options);
    const now = Date.now();

    if (!staleTimestamp || now < staleTimestamp) {
      // Data is fresh, return it
      return cached;
    }

    // Data is stale, revalidate in background
    fetcher().then(fresh => {
      cache.set(key, fresh, options);
      const newStaleTime = now + (options?.staleTime || 60) * 1000;
      cache.set(staleKey, newStaleTime, options);
    }).catch(console.error);

    // Return stale data while revalidating
    return cached;
  }

  // No cache, fetch fresh
  const fresh = await fetcher();
  await cache.set(key, fresh, options);

  const staleTime = Date.now() + (options?.staleTime || 60) * 1000;
  await cache.set(staleKey, staleTime, options);

  return fresh;
}

export default RedisCache;