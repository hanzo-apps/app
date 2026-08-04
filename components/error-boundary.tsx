'use client';

import { Button } from '@hanzo/ui';
import { YStack, H2, Paragraph } from '@hanzo/gui';
import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <YStack alignItems="center" justifyContent="center" minHeight={400} padding="$6">
          <AlertCircle size={48} color="$red9" />
          <H2 fontSize="$7" fontWeight="500" marginBottom="$2" textAlign="center">Something went wrong</H2>
          <Paragraph color="$color11" marginBottom="$4" textAlign="center">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Paragraph>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            paddingHorizontal="$4" paddingVertical="$2" backgroundColor="$color12" borderRadius="$3" hoverStyle={{ backgroundColor: "$color12" }}
          >
            Try again
          </Button>
        </YStack>
      );
    }

    return this.props.children;
  }
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = () => setError(null);
  const throwError = (error: Error) => setError(error);

  return { throwError, resetError };
}