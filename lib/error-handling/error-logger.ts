import * as Sentry from '@sentry/nextjs';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private isDevelopment = process.env.NODE_ENV === 'development';
  private errorQueue: Array<{ error: Error; context?: ErrorContext }> = [];
  private isInitialized = false;

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  initialize(dsn?: string): void {
    if (this.isInitialized) return;

    if (!this.isDevelopment && dsn) {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'production',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        debug: false,
        integrations: [
          Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],
        beforeSend(event, hint) {
          // Filter out sensitive information
          if (event.request?.cookies) {
            delete event.request.cookies;
          }
          if (event.user?.email) {
            event.user.email = '***';
          }
          return event;
        },
        ignoreErrors: [
          // Browser-specific errors to ignore
          'ResizeObserver loop limit exceeded',
          'ResizeObserver loop completed with undelivered notifications',
          'Non-Error promise rejection captured',
          // Network errors that are usually temporary
          'NetworkError',
          'Failed to fetch',
          'Load failed',
          // User-caused errors
          'AbortError',
        ],
      });
      this.isInitialized = true;

      // Process queued errors
      this.processErrorQueue();
    }
  }

  private processErrorQueue(): void {
    while (this.errorQueue.length > 0) {
      const { error, context } = this.errorQueue.shift()!;
      this.logError(error, ErrorSeverity.MEDIUM, context);
    }
  }

  logError(
    error: Error | string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext
  ): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Queue errors if not initialized yet
    if (!this.isInitialized && !this.isDevelopment) {
      this.errorQueue.push({ error: errorObj, context });
      return;
    }

    // Console logging for development
    if (this.isDevelopment) {
      console.group(`🔴 Error [${severity.toUpperCase()}]`);
      console.error('Error:', errorObj.message);
      console.error('Stack:', errorObj.stack);
      if (context) {
        console.table(context);
      }
      console.groupEnd();
    }

    // Send to Sentry in production
    if (!this.isDevelopment && this.isInitialized) {
      Sentry.withScope((scope) => {
        scope.setLevel(this.mapSeverityToSentryLevel(severity));

        if (context) {
          scope.setContext('errorContext', context as Record<string, unknown>);
          if (context.userId) {
            scope.setUser({ id: context.userId });
          }
          if (context.component) {
            scope.setTag('component', context.component);
          }
          if (context.action) {
            scope.setTag('action', context.action);
          }
        }

        Sentry.captureException(errorObj);
      });
    }

    // Store in localStorage for debugging
    this.storeErrorLocally(errorObj, severity, context);
  }

  private mapSeverityToSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'info';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.CRITICAL:
        return 'fatal';
      default:
        return 'error';
    }
  }

  private storeErrorLocally(
    error: Error,
    severity: ErrorSeverity,
    context?: ErrorContext
  ): void {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        severity,
        context,
      };

      const storedErrors = localStorage.getItem('hanzo_error_log');
      const errors = storedErrors ? JSON.parse(storedErrors) : [];

      // Keep only last 50 errors
      if (errors.length >= 50) {
        errors.shift();
      }

      errors.push(errorLog);
      localStorage.setItem('hanzo_error_log', JSON.stringify(errors));
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }

  clearLocalErrors(): void {
    try {
      localStorage.removeItem('hanzo_error_log');
    } catch (e) {
      // Silently fail
    }
  }

  getLocalErrors(): Array<unknown> {
    try {
      const storedErrors = localStorage.getItem('hanzo_error_log');
      return storedErrors ? JSON.parse(storedErrors) : [];
    } catch (e) {
      return [];
    }
  }
}

export const errorLogger = ErrorLogger.getInstance();