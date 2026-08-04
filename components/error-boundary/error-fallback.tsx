'use client';

import { Button } from '@hanzo/ui';
import { XStack, YStack, H3, Paragraph, H1, H2, SizableText } from '@hanzo/gui';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  level?: 'page' | 'component' | 'app';
  isPermanent?: boolean;
  isolate?: boolean;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  level = 'component',
  isPermanent = false,
  isolate = false,
}: ErrorFallbackProps) {
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleGoHome = () => {
    router.push('/');
  };

  const handleReportBug = () => {
    // Open bug report form or redirect to support
    const bugReportUrl = `/support?error=${encodeURIComponent(error.message)}`;
    router.push(bugReportUrl);
  };

  // Component-level error - small inline error
  if (level === 'component' && !isPermanent) {
    return (
      <XStack alignItems="center" justifyContent="center" padding="$4" {...{ position: isolate ? "absolute" : undefined, top: isolate ? 0 : undefined, right: isolate ? 0 : undefined, bottom: isolate ? 0 : undefined, left: isolate ? 0 : undefined }}>
        <YStack backgroundColor="$red1" borderWidth={1} borderColor="$red3" borderRadius="$5" padding="$4" maxWidth={448} $theme-dark={{ backgroundColor: "$red12", borderColor: "$red11" }}>
          <XStack alignItems="flex-start" columnGap="$3">
            <AlertCircle size={20} />
            <YStack flex={1}>
              <H3 fontSize="$3" fontWeight="500" color="$red11" $theme-dark={{ color: "$red3" }}>
                Component Error
              </H3>
              <Paragraph fontSize="$3" color="$red10" marginTop="$1" $theme-dark={{ color: "$red4" }}>
                {isDevelopment ? error.message : 'Something went wrong with this component.'}
              </Paragraph>
              <Button
                onClick={resetErrorBoundary}
                marginTop="$3"
              >
                <SizableText fontSize="$3" color="$red10" textDecorationLine="underline" $theme-dark={{ color: "$red4" }} hoverStyle={{ color: "$red9" }}>
                  Try again
                </SizableText>
              </Button>
            </YStack>
          </XStack>
        </YStack>
      </XStack>
    );
  }

  // Page or App level error - full page error
  return (
    <XStack minHeight="100%" backgroundColor="$background" alignItems="center" justifyContent="center" padding="$4">
      <YStack maxWidth={448} width="100%">
        <YStack backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$8" elevation={5} overflow="hidden">
          <YStack borderBottomWidth={1} borderColor="$red9" backgroundColor="$red9" padding="$5">
            <XStack alignItems="center" columnGap="$3">
              <YStack backgroundColor="$red9" borderRadius="$10" padding="$3">
                <AlertCircle size={32} />
              </YStack>
              <div>
                <H1 fontSize="$8" fontWeight="500" color="$color">
                  {level === 'app' ? 'Application Error' : 'Page Error'}
                </H1>
                <Paragraph color="$color11" fontSize="$3" marginTop="$1">
                  {isPermanent
                    ? 'Multiple errors detected. Please refresh the page.'
                    : 'An unexpected error occurred.'}
                </Paragraph>
              </div>
            </XStack>
          </YStack>

          <YStack padding="$5">
            {isDevelopment && (
              <YStack marginBottom="$5">
                <YStack backgroundColor="$color3" borderRadius="$5" padding="$4" marginBottom="$4">
                  <H2 fontSize="$3" fontWeight="500" color="$color11" marginBottom="$2">
                    Error Details (Development Only)
                  </H2>
                  <Paragraph fontSize="$3" color="$color" fontFamily="$mono">
                    {error.message}
                  </Paragraph>
                </YStack>

                {error.stack && (
                  <details style={{ fontSize: 12 }}>
                    <summary style={{ cursor: "pointer", color: "var(--muted-foreground)" }}>
                      View Stack Trace
                    </summary>
                    <SizableText marginTop="$2" backgroundColor="$color3" borderRadius="$2" padding="$3" color="$color11" overflow="scroll" fontFamily="$mono" whiteSpace="pre">
                      {error.stack}
                    </SizableText>
                  </details>
                )}
              </YStack>
            )}

            {!isDevelopment && (
              <YStack marginBottom="$5">
                <Paragraph color="$color11">
                  We apologize for the inconvenience. The error has been logged and our team will
                  investigate the issue.
                </Paragraph>
                <YStack marginTop="$4" padding="$3" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" borderRadius="$5">
                  <Paragraph fontSize="$3" color="$color">
                    <strong>Error ID:</strong> {generateErrorId()}
                  </Paragraph>
                </YStack>
              </YStack>
            )}

            <YStack rowGap="$3">
              {!isPermanent && (
                <Button
                  onClick={resetErrorBoundary}
                  width="100%" alignItems="center" justifyContent="center" columnGap="$2" backgroundColor="$color12" paddingVertical="$3" paddingHorizontal="$4" borderRadius="$5" hoverStyle={{ backgroundColor: "$color12" }}
                >
                  <RefreshCw size={16} />
                  <SizableText color="$background" fontWeight="500">Try Again</SizableText>
                </Button>
              )}

              {isPermanent && (
                <Button
                  onClick={() => window.location.reload()}
                  width="100%" alignItems="center" justifyContent="center" columnGap="$2" backgroundColor="$color12" paddingVertical="$3" paddingHorizontal="$4" borderRadius="$5" hoverStyle={{ backgroundColor: "$color12" }}
                >
                  <RefreshCw size={16} />
                  <SizableText color="$background" fontWeight="500">Refresh Page</SizableText>
                </Button>
              )}

              <Button
                onClick={handleGoHome}
                width="100%" alignItems="center" justifyContent="center" columnGap="$2" backgroundColor="$color4" paddingVertical="$3" paddingHorizontal="$4" borderRadius="$5" hoverStyle={{ backgroundColor: "$color4" }}
              >
                <Home size={16} />
                <SizableText color="$color">Go to Homepage</SizableText>
              </Button>

              {!isDevelopment && (
                <Button
                  onClick={handleReportBug}
                  width="100%" alignItems="center" justifyContent="center" columnGap="$2" borderWidth={1} borderColor="$borderColor" paddingVertical="$3" paddingHorizontal="$4" borderRadius="$5" hoverStyle={{ backgroundColor: "$color3" }}
                >
                  <Bug size={16} />
                  <SizableText color="$color">Report This Issue</SizableText>
                </Button>
              )}
            </YStack>
          </YStack>
        </YStack>

        {isDevelopment && (
          <SizableText marginTop="$4" textAlign="center" fontSize="$1" color="$color11">
            This detailed error view is only shown in development mode.
          </SizableText>
        )}
      </YStack>
    </XStack>
  );
}

function generateErrorId(): string {
  return `ERR_${Date.now().toString(36).toUpperCase()}_${Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase()}`;
}