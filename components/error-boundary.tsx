'use client';

import { Button } from '@hanzo/ui';
import { YStack, H2, Paragraph } from '@hanzo/ui';
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
          <AlertCircle size={48} />
          <H2 fontSize="$7" fontWeight="500" marginBottom="$2" textAlign="center">This part didn&apos;t load</H2>
          <Paragraph color="$color11" marginBottom="$4" textAlign="center">
            {this.state.error?.message || 'The error came back with no detail. Try again, and reload the page if it happens twice.'}
          </Paragraph>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            paddingHorizontal="$4" paddingVertical="$2" backgroundColor="$color5" borderWidth={1} borderColor="$color6" borderRadius="$3" hoverStyle={{ backgroundColor: "$color6" }}
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