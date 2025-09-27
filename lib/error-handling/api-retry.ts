import { errorLogger, ErrorSeverity } from './error-logger';

export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: Error) => void;
  timeout?: number;
}

const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'onRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  timeout: 30000,
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown,
    public attempt?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${finalConfig.timeout}ms`));
        }, finalConfig.timeout);
      });

      // Race between the actual function and timeout
      const result = await Promise.race([fn(), timeoutPromise]);

      // Success - return result
      return result;
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      const shouldRetry = shouldRetryRequest(error, attempt, finalConfig);

      // If not retryable and we haven't exhausted attempts, throw immediately
      if (!shouldRetry && attempt < finalConfig.maxAttempts) {
        // Log non-retryable error
        errorLogger.logError(error as Error, ErrorSeverity.HIGH, {
          action: 'ApiCall',
          metadata: {
            attempt,
            maxAttempts: finalConfig.maxAttempts,
            retryable: false,
          },
        });
        throw error;
      }

      // If we've exhausted attempts, break out of loop to wrap in ApiError
      if (attempt >= finalConfig.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(attempt, finalConfig);

      // Call retry callback if provided
      config?.onRetry?.(attempt, error as Error);

      // Log retry attempt
      if (attempt < finalConfig.maxAttempts) {
        console.warn(
          `API call failed (attempt ${attempt}/${finalConfig.maxAttempts}). Retrying in ${delay}ms...`,
          error
        );
      }

      // Wait before retrying
      if (attempt < finalConfig.maxAttempts) {
        await sleep(delay);
      }
    }
  }

  // All attempts failed
  const finalError = new ApiError(
    `API call failed after ${finalConfig.maxAttempts} attempts: ${lastError?.message}`,
    undefined,
    undefined,
    finalConfig.maxAttempts
  );

  errorLogger.logError(finalError, ErrorSeverity.HIGH, {
    action: 'ApiCall',
    metadata: {
      maxAttempts: finalConfig.maxAttempts,
      exhaustedRetries: true,
      lastError: lastError?.message,
    },
  });

  throw finalError;
}

function shouldRetryRequest(
  error: unknown,
  attempt: number,
  config: Required<Omit<RetryConfig, 'onRetry'>>
): boolean {
  if (attempt >= config.maxAttempts) {
    return false;
  }

  if (error instanceof ApiError && error.status) {
    return config.retryableStatuses.includes(error.status);
  }

  // Network errors are retryable
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const networkErrors = [
      'network',
      'fetch',
      'timeout',
      'aborted',
      'connection',
      'econnrefused',
      'enotfound',
      'etimedout',
    ];
    return networkErrors.some((keyword) => message.includes(keyword));
  }

  return false;
}

function calculateDelay(attempt: number, config: Required<Omit<RetryConfig, 'onRetry'>>): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelay
  );

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return Math.floor(delay + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch wrapper with retry logic
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig?: RetryConfig
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new ApiError(
        `HTTP error! status: ${response.status}`,
        response.status,
        await response.text().catch(() => null)
      );
    }

    return response;
  }, retryConfig);
}

// Create a circuit breaker for API endpoints
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,
    private timeout = 60000, // 1 minute
    private halfOpenRequests = 3
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        this.failures = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();

      if (this.state === 'HALF_OPEN') {
        if (++this.failures >= this.halfOpenRequests) {
          this.state = 'CLOSED';
          this.failures = 0;
        }
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      errorLogger.logError(
        new Error(`Circuit breaker opened after ${this.failures} failures`),
        ErrorSeverity.HIGH,
        {
          action: 'CircuitBreaker',
          metadata: {
            state: 'OPEN',
            failures: this.failures,
          },
        }
      );
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}