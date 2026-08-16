'use client';

import { Button } from '@hanzo/ui';
import { XStack, YStack, H3, Paragraph, H1, H2, SizableText } from '@hanzo/ui';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { screen } from '@/lib/chrome';

interface ErrorFallbackProps {
  error: Error;
  /**
   * The reference the logger minted when the boundary caught this error, so the
   * string shown here is the string in the stored record. It used to be built
   * inline in this file's JSX, which produced a FRESH value on every re-render:
   * the card asked people to quote a number that matched nothing on our side
   * and had already changed by the time they read it out.
   */
  reference?: string | null;
  resetErrorBoundary: () => void;
  level?: 'page' | 'component' | 'app';
  isPermanent?: boolean;
  isolate?: boolean;
}

export function ErrorFallback({
  error,
  reference,
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
    // Carry BOTH halves the card names: the message a person can read, and the
    // reference that joins their report to the stored record.
    const params = new URLSearchParams({ error: error.message });
    if (reference) params.set('ref', reference);
    router.push(`/support?${params.toString()}`);
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
                This part didn&apos;t load
              </H3>
              <Paragraph fontSize="$3" color="$red10" marginTop="$1" $theme-dark={{ color: "$red4" }}>
                {isDevelopment ? error.message : 'The rest of the page still works. It retries on its own in a few seconds.'}
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
    <XStack {...screen} backgroundColor="$background" padding="$4">
      <YStack maxWidth={448} width="100%">
        <YStack backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$8" elevation={5} overflow="hidden">
          <YStack borderBottomWidth={1} borderColor="$red9" backgroundColor="$red9" padding="$5">
            <XStack alignItems="center" columnGap="$3">
              <YStack backgroundColor="$red9" borderRadius="$10" padding="$3">
                <AlertCircle size={32} />
              </YStack>
              <div>
                <H1 fontSize="$8" fontWeight="500" color="$color">
                  {level === 'app' ? 'Hanzo hit an error' : 'This page hit an error'}
                </H1>
                <Paragraph color="$color11" fontSize="$3" marginTop="$1">
                  {isPermanent
                    ? 'It failed three times in a row, so it stopped retrying. Reload the page.'
                    : 'It stopped part-way through. Retrying usually works.'}
                </Paragraph>
              </div>
            </XStack>
          </YStack>

          <YStack padding="$5">
            {isDevelopment && (
              <YStack marginBottom="$5">
                <YStack backgroundColor="$color3" borderRadius="$5" padding="$4" marginBottom="$4">
                  <H2 fontSize="$3" fontWeight="500" color="$color11" marginBottom="$2">
                    Error detail — development only
                  </H2>
                  <Paragraph fontSize="$3" color="$color" fontFamily="$mono">
                    {error.message}
                  </Paragraph>
                </YStack>

                {error.stack && (
                  <details style={{ fontSize: 12 }}>
                    <summary style={{ cursor: "pointer", color: "var(--muted-foreground)" }}>
                      View the stack trace
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
                  The error was reported to us automatically. If it keeps happening, use
                  Report this issue below — it carries the error message
                  {reference ? ' and the reference' : ''} with it.
                </Paragraph>
                {reference && (
                  <YStack marginTop="$4" padding="$3" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" borderRadius="$5">
                    <Paragraph fontSize="$3" color="$color">
                      <strong>Reference:</strong> {reference}
                    </Paragraph>
                  </YStack>
                )}
              </YStack>
            )}

            <YStack rowGap="$3">
              {!isPermanent && (
                <Button
                  onClick={resetErrorBoundary}
                  width="100%" alignItems="center" justifyContent="center" columnGap="$2" backgroundColor="$color5" borderWidth={1} borderColor="$color6" paddingVertical="$3" paddingHorizontal="$4" borderRadius="$5" hoverStyle={{ backgroundColor: "$color6" }}
                >
                  <RefreshCw size={16} />
                  <SizableText color="$background" fontWeight="500">Try again</SizableText>
                </Button>
              )}

              {isPermanent && (
                <Button
                  onClick={() => window.location.reload()}
                  width="100%" alignItems="center" justifyContent="center" columnGap="$2" backgroundColor="$color5" borderWidth={1} borderColor="$color6" paddingVertical="$3" paddingHorizontal="$4" borderRadius="$5" hoverStyle={{ backgroundColor: "$color6" }}
                >
                  <RefreshCw size={16} />
                  <SizableText color="$background" fontWeight="500">Reload the page</SizableText>
                </Button>
              )}

              <Button
                onClick={handleGoHome}
                width="100%" alignItems="center" justifyContent="center" columnGap="$2" backgroundColor="$color4" paddingVertical="$3" paddingHorizontal="$4" borderRadius="$5" hoverStyle={{ backgroundColor: "$color4" }}
              >
                <Home size={16} />
                <SizableText color="$color">Go to the home page</SizableText>
              </Button>

              {!isDevelopment && (
                <Button
                  onClick={handleReportBug}
                  width="100%" alignItems="center" justifyContent="center" columnGap="$2" borderWidth={1} borderColor="$borderColor" paddingVertical="$3" paddingHorizontal="$4" borderRadius="$5" hoverStyle={{ backgroundColor: "$color3" }}
                >
                  <Bug size={16} />
                  <SizableText color="$color">Report this issue</SizableText>
                </Button>
              )}
            </YStack>
          </YStack>
        </YStack>

        {isDevelopment && (
          <SizableText marginTop="$4" textAlign="center" fontSize="$1" color="$color11">
            This detail only appears in development.
          </SizableText>
        )}
      </YStack>
    </XStack>
  );
}

