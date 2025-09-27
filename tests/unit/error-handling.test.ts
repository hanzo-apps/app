import { errorLogger, ErrorSeverity } from '@/lib/error-handling/error-logger';
import { withRetry, ApiError, CircuitBreaker } from '@/lib/error-handling/api-retry';

describe('Error Handling System', () => {
  describe('Error Logger', () => {
    beforeEach(() => {
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
    });

    it('should log errors with correct severity', () => {
      const error = new Error('Test error');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      errorLogger.logError(error, ErrorSeverity.HIGH, {
        component: 'TestComponent',
        action: 'TestAction',
      });

      if (process.env.NODE_ENV === 'development') {
        expect(consoleSpy).toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
    });

    it('should store errors locally', () => {
      const error = new Error('Local storage test');

      errorLogger.logError(error, ErrorSeverity.MEDIUM);

      const storedErrors = errorLogger.getLocalErrors();
      expect(storedErrors).toHaveLength(1);
      expect(storedErrors[0]).toMatchObject({
        message: 'Local storage test',
        severity: ErrorSeverity.MEDIUM,
      });
    });

    it('should clear local errors', () => {
      errorLogger.logError(new Error('Error to clear'), ErrorSeverity.LOW);

      errorLogger.clearLocalErrors();

      const storedErrors = errorLogger.getLocalErrors();
      expect(storedErrors).toHaveLength(0);
    });
  });

  describe('API Retry Logic', () => {
    it('should retry failed requests', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return 'success';
      });

      const result = await withRetry(fn, {
        maxAttempts: 3,
        initialDelay: 10,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = jest.fn(async () => {
        throw new Error('Network error: connection failed');
      });

      await expect(
        withRetry(fn, {
          maxAttempts: 2,
          initialDelay: 10,
        })
      ).rejects.toThrow(ApiError);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const fn = jest.fn(async () => {
        throw new ApiError('Bad request', 400);
      });

      await expect(
        withRetry(fn, {
          maxAttempts: 3,
          initialDelay: 10,
        })
      ).rejects.toThrow(ApiError);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect timeout', async () => {
      const fn = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return 'success';
      });

      await expect(
        withRetry(fn, {
          maxAttempts: 1,
          timeout: 100,
        })
      ).rejects.toThrow('Request timeout');

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after threshold failures', async () => {
      const breaker = new CircuitBreaker(3, 1000);
      const fn = jest.fn(async () => {
        throw new Error('Service error');
      });

      // Fail 3 times to open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow('Service error');
      }

      expect(breaker.getState()).toBe('OPEN');

      // Should reject immediately when open
      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');
      expect(fn).toHaveBeenCalledTimes(3); // Not called on 4th attempt
    });

    it('should transition to half-open after timeout', async () => {
      const breaker = new CircuitBreaker(2, 100);
      const fn = jest.fn(async () => {
        throw new Error('Service error');
      });

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe('OPEN');

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should try again (half-open)
      await expect(breaker.execute(fn)).rejects.toThrow('Service error');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should close circuit after successful requests in half-open state', async () => {
      const breaker = new CircuitBreaker(2, 100, 2);
      let shouldFail = true;
      const fn = jest.fn(async () => {
        if (shouldFail) {
          throw new Error('Service error');
        }
        return 'success';
      });

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Make successful requests
      shouldFail = false;
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(fn)).resolves.toBe('success');
      }

      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should reset circuit breaker', async () => {
      const breaker = new CircuitBreaker(2, 1000);
      const fn = jest.fn(async () => {
        throw new Error('Service error');
      });

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe('OPEN');

      // Reset
      breaker.reset();
      expect(breaker.getState()).toBe('CLOSED');

      // Should work again
      await expect(breaker.execute(fn)).rejects.toThrow('Service error');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
});