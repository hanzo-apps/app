'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorLogger, ErrorSeverity } from '@/lib/error-handling/error-logger';
import { ErrorFallback } from './error-fallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'component' | 'app';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private readonly ERROR_RESET_TIME = 5000; // Reset error count after 5 seconds
  private readonly MAX_ERROR_COUNT = 3; // Max errors before showing permanent error

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, level = 'component' } = this.props;
    const currentTime = Date.now();

    // Check if this is a rapid succession of errors
    const isRapidError = currentTime - this.state.lastErrorTime < this.ERROR_RESET_TIME;
    const newErrorCount = isRapidError ? this.state.errorCount + 1 : 1;

    // Log the error
    const severity = this.getSeverityByLevel(level);
    errorLogger.logError(error, severity, {
      component: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
      action: 'ComponentError',
      metadata: {
        level,
        errorBoundary: true,
        errorCount: newErrorCount,
        componentStack: errorInfo.componentStack,
      },
    });

    // Update state
    this.setState({
      errorInfo,
      errorCount: newErrorCount,
      lastErrorTime: currentTime,
    });

    // Call custom error handler
    onError?.(error, errorInfo);

    // Set up auto-reset if error count is below threshold
    if (newErrorCount < this.MAX_ERROR_COUNT) {
      this.scheduleReset();
    }
  }

  private getSeverityByLevel(level: string): ErrorSeverity {
    switch (level) {
      case 'app':
        return ErrorSeverity.CRITICAL;
      case 'page':
        return ErrorSeverity.HIGH;
      case 'component':
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  private scheduleReset = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, this.ERROR_RESET_TIME);
  };

  componentDidUpdate(prevProps: Props): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      if (resetOnPropsChange && prevProps.children !== this.props.children) {
        this.resetErrorBoundary();
      }

      if (resetKeys && prevProps.resetKeys) {
        for (let i = 0; i < resetKeys.length; i++) {
          if (prevProps.resetKeys[i] !== resetKeys[i]) {
            this.resetErrorBoundary();
            break;
          }
        }
      }
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorCount } = this.state;
    const { fallback, children, isolate, level = 'component' } = this.props;

    if (hasError && error) {
      // Show permanent error if too many errors
      const isPermanent = errorCount >= this.MAX_ERROR_COUNT;

      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallback
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
          level={level}
          isPermanent={isPermanent}
          isolate={isolate}
        />
      );
    }

    return children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}