import { useCallback } from 'react';
import { errorLogger, ErrorSeverity, ErrorContext } from '@/lib/error-handling/error-logger';

export interface UseErrorHandlerOptions {
  component?: string;
  severity?: ErrorSeverity;
  fallback?: () => void;
}

export function useErrorHandler(options?: UseErrorHandlerOptions) {
  const handleError = useCallback(
    (error: Error | unknown, context?: Partial<ErrorContext>) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));

      // Log the error
      errorLogger.logError(
        errorObj,
        options?.severity || ErrorSeverity.MEDIUM,
        {
          component: options?.component,
          ...context,
        }
      );

      // Call fallback if provided
      options?.fallback?.();

      // Re-throw in development for better debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Error caught by useErrorHandler:', errorObj);
      }
    },
    [options]
  );

  const handleAsyncError = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      context?: Partial<ErrorContext>
    ): Promise<T | undefined> => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error, context);
        return undefined;
      }
    },
    [handleError]
  );

  const wrapAsync = useCallback(
    <T extends (...args: any[]) => Promise<any>>(
      fn: T,
      context?: Partial<ErrorContext>
    ): T => {
      return (async (...args: Parameters<T>) => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error, { ...context, action: fn.name || 'AsyncFunction' });
          throw error; // Re-throw to maintain promise rejection
        }
      }) as T;
    },
    [handleError]
  );

  return {
    handleError,
    handleAsyncError,
    wrapAsync,
  };
}

// Hook for monitoring component errors
export function useComponentErrorMonitor(componentName: string) {
  const { handleError } = useErrorHandler({
    component: componentName,
    severity: ErrorSeverity.LOW,
  });

  const logWarning = useCallback(
    (message: string, metadata?: Record<string, unknown>) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[${componentName}] ${message}`, metadata);
      }
      errorLogger.logError(new Error(message), ErrorSeverity.LOW, {
        component: componentName,
        metadata,
      });
    },
    [componentName]
  );

  const logInfo = useCallback(
    (message: string, metadata?: Record<string, unknown>) => {
      if (process.env.NODE_ENV === 'development') {
        console.info(`[${componentName}] ${message}`, metadata);
      }
    },
    [componentName]
  );

  return {
    handleError,
    logWarning,
    logInfo,
  };
}