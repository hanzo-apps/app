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

/**
 * The reporter that actually ships an error off-device — the authed @hanzo/event
 * client, injected by AnalyticsRoot once it mounts (it holds the IAM token). Until
 * then errors queue and flush on wire-up. This is the ONE error pipe: errors are
 * events on the same stream (subsumes @sentry).
 */
type Reporter = (error: Error, severity: ErrorSeverity, context?: ErrorContext) => void;
let reporter: Reporter | null = null;

/** Wire the error reporter (called by AnalyticsRoot with the authed client). */
export function setErrorReporter(fn: Reporter): void {
  reporter = fn;
  errorLogger.flushQueue();
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private isDevelopment = process.env.NODE_ENV === 'development';
  private errorQueue: Array<{ error: Error; severity: ErrorSeverity; context?: ErrorContext }> = [];

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /** Kept for API compatibility. Off-device reporting is now wired by
   *  AnalyticsRoot via setErrorReporter (the authed @hanzo/event client) — there
   *  is no separate DSN to initialize. */
  initialize(_dsn?: string): void {}

  /** Drain queued errors once the reporter is wired. */
  flushQueue(): void {
    if (!reporter) return;
    while (this.errorQueue.length > 0) {
      const { error, severity, context } = this.errorQueue.shift()!;
      reporter(error, severity, context);
    }
  }

  logError(
    error: Error | string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext
  ): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

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

    // Ship it off-device via the @hanzo/event reporter — or queue until wired.
    if (reporter) {
      reporter(errorObj, severity, context);
    } else if (!this.isDevelopment) {
      this.errorQueue.push({ error: errorObj, severity, context });
    }

    // Store in localStorage for debugging
    this.storeErrorLocally(errorObj, severity, context);
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