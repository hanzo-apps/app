import { fetchWithRetry, ApiError, CircuitBreaker } from '@/lib/error-handling/api-retry';
import { errorLogger, ErrorSeverity } from '@/lib/error-handling/error-logger';

interface ApiClientConfig {
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  maxRetries?: number;
  timeout?: number;
  useCircuitBreaker?: boolean;
}

interface RequestOptions extends RequestInit {
  retries?: number;
  timeout?: number;
  skipRetry?: boolean;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private maxRetries: number;
  private timeout: number;
  private circuitBreakers: Map<string, CircuitBreaker>;
  private useCircuitBreaker: boolean;

  constructor(config?: ApiClientConfig) {
    this.baseURL = config?.baseURL || process.env.NEXT_PUBLIC_API_URL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config?.defaultHeaders,
    };
    this.maxRetries = config?.maxRetries || 3;
    this.timeout = config?.timeout || 30000;
    this.useCircuitBreaker = config?.useCircuitBreaker || false;
    this.circuitBreakers = new Map();
  }

  private getCircuitBreaker(endpoint: string): CircuitBreaker {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, new CircuitBreaker());
    }
    return this.circuitBreakers.get(endpoint)!;
  }

  private async executeWithCircuitBreaker<T>(
    endpoint: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.useCircuitBreaker) {
      return fn();
    }

    const breaker = this.getCircuitBreaker(endpoint);
    try {
      return await breaker.execute(fn);
    } catch (error) {
      if (error instanceof Error && error.message === 'Circuit breaker is OPEN') {
        throw new ApiError(
          `Service temporarily unavailable for ${endpoint}`,
          503,
          null,
          0
        );
      }
      throw error;
    }
  }

  private buildURL(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseURL}${cleanPath}`;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorBody = null;

      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          errorBody = await response.json();
          errorMessage = errorBody.message || errorBody.error || errorMessage;
        } else {
          errorBody = await response.text();
          if (errorBody) {
            errorMessage = errorBody;
          }
        }
      } catch {
        // Ignore parsing errors
      }

      throw new ApiError(errorMessage, response.status, errorBody);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text() as unknown as T;
  }

  async request<T = any>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const url = this.buildURL(path);
    const { retries, timeout, skipRetry, ...fetchOptions } = options || {};

    const finalOptions: RequestInit = {
      ...fetchOptions,
      method,
      headers: {
        ...this.defaultHeaders,
        ...(fetchOptions.headers as Record<string, string>),
      },
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token && !finalOptions.headers['Authorization']) {
        finalOptions.headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const executeRequest = async () => {
        const response = skipRetry
          ? await fetch(url, finalOptions)
          : await fetchWithRetry(url, finalOptions, {
              maxAttempts: retries || this.maxRetries,
              timeout: timeout || this.timeout,
              onRetry: (attempt, error) => {
                errorLogger.logError(error, ErrorSeverity.LOW, {
                  action: 'ApiRetry',
                  metadata: {
                    url,
                    method,
                    attempt,
                  },
                });
              },
            });

        return this.handleResponse<T>(response);
      };

      return await this.executeWithCircuitBreaker(path, executeRequest);
    } catch (error) {
      // Log the final error
      errorLogger.logError(error as Error, ErrorSeverity.HIGH, {
        action: 'ApiRequest',
        metadata: {
          url,
          method,
          path,
        },
      });

      throw error;
    }
  }

  // Convenience methods
  async get<T = any>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T = any>(
    path: string,
    body?: any,
    options?: Omit<RequestOptions, 'body'>
  ): Promise<T> {
    return this.request<T>('POST', path, {
      ...options,
      body: typeof body === 'object' ? JSON.stringify(body) : body,
    });
  }

  async put<T = any>(
    path: string,
    body?: any,
    options?: Omit<RequestOptions, 'body'>
  ): Promise<T> {
    return this.request<T>('PUT', path, {
      ...options,
      body: typeof body === 'object' ? JSON.stringify(body) : body,
    });
  }

  async patch<T = any>(
    path: string,
    body?: any,
    options?: Omit<RequestOptions, 'body'>
  ): Promise<T> {
    return this.request<T>('PATCH', path, {
      ...options,
      body: typeof body === 'object' ? JSON.stringify(body) : body,
    });
  }

  async delete<T = any>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/api/health', { skipRetry: true, timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  // Reset circuit breakers
  resetCircuitBreakers(): void {
    this.circuitBreakers.forEach((breaker) => breaker.reset());
  }

  getCircuitBreakerStatus(endpoint: string): string | null {
    const breaker = this.circuitBreakers.get(endpoint);
    return breaker ? breaker.getState() : null;
  }
}

// Export singleton instance
export const apiClient = new ApiClient({
  useCircuitBreaker: true,
});

// Export class for custom instances
export { ApiClient };

// Export types
export type { ApiClientConfig, RequestOptions };