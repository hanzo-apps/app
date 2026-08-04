'use client';

import { SizableText, YStack, XStack, H3, Paragraph, Anchor } from '@hanzo/gui';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useIam } from '@hanzo/iam/react';
import { EVENTS } from '@hanzo/event';
import { useAnalytics } from '@hanzo/event/react';
import { HanzoLogo } from '@/components/HanzoLogo';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@hanzo/ui';
import { Sparkles, Zap, Shield, Rocket } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

/**
 * /signup — HIP-0111 canonical. There is no local credential form: Hanzo IAM
 * owns every credential interaction. "Sign up with Hanzo" starts the same
 * @hanzo/iam OAuth2 PKCE flow as /login (IAM presents register on its
 * authorize page). Monochrome, on-brand — no red, no off-brand gradients.
 */
export default function SignupPage() {
  const { login } = useIam();
  const analytics = useAnalytics();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    analytics.capture(EVENTS.SIGNUP_VIEWED);
  }, [analytics]);

  const handleSignup = () => {
    analytics.capture(EVENTS.SIGNUP_SUBMITTED);
    setLoading(true);
    login();
  };

  return (
    <YStack minHeight="100%" backgroundColor="$background">
      {/* Navigation */}
      <YStack borderBottomWidth={1} borderColor="$borderColor">
        <XStack maxWidth={1280} alignSelf="center" paddingHorizontal="$4" paddingVertical="$4" alignItems="center" justifyContent="space-between" $md={{ paddingHorizontal: "$6" }}>
          <Link href="/"><XStack alignItems="center" gap="$2.5">
            <HanzoLogo size={32} color="var(--foreground)" />
            <SizableText fontSize="$7" fontWeight="500">Hanzo</SizableText>
          </XStack></Link>
          <Link href="/login">
            <Button variant="outline" borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}>
              Sign in
            </Button>
          </Link>
        </XStack>
      </YStack>

      {/* Main Content */}
      <XStack flex={1} alignItems="center" justifyContent="center" padding="$4" paddingVertical="$8">
        <YStack width="100%" maxWidth={448}>
          <Card backgroundColor="$background" borderColor="$borderColor">
            <CardHeader rowGap="$1" alignItems="center" paddingBottom="$6">
              <XStack justifyContent="center" marginBottom="$5">
                <XStack width="$10" height="$10" backgroundColor="$color3" borderWidth={1} borderColor="$borderColor" borderRadius="$8" alignItems="center" justifyContent="center" position="relative">
                  <HanzoLogo size={40} color="var(--foreground)" />
                  <Badge className="absolute -top-2 -right-2">
                    Free
                  </Badge>
                </XStack>
              </XStack>
              <CardTitle fontSize="$8">Create your account</CardTitle>
              <CardDescription color="$color11">
                Start building with Hanzo AI today
              </CardDescription>
            </CardHeader>
            <CardContent rowGap="$5">
              {/* What you get section */}
              <YStack rowGap="$3" padding="$4" backgroundColor="$color3" borderRadius="$5" borderWidth={1} borderColor="$borderColor">
                <H3 fontSize="$3" fontWeight="500" color="$color" marginBottom="$3">What you'll get:</H3>
                <YStack gap="$2">
                  <XStack alignItems="center" gap="$3">
                    <Sparkles size={16} />
                    <SizableText fontSize="$3" color="$color">Access to 400+ AI models</SizableText>
                  </XStack>
                  <XStack alignItems="center" gap="$3">
                    <Zap size={16} />
                    <SizableText fontSize="$3" color="$color">$5 free cloud credits to start</SizableText>
                  </XStack>
                  <XStack alignItems="center" gap="$3">
                    <Shield size={16} />
                    <SizableText fontSize="$3" color="$color">Secure cloud infrastructure</SizableText>
                  </XStack>
                  <XStack alignItems="center" gap="$3">
                    <Rocket size={16} />
                    <SizableText fontSize="$3" color="$color">Deploy instantly to production</SizableText>
                  </XStack>
                </YStack>
              </YStack>

              {/* Signup Button — Hanzo IAM, the only way */}
              <Button
                onClick={handleSignup}
                disabled={loading}
                width="100%" backgroundColor="$color5" borderWidth={1} borderColor="$color6" hoverStyle={{ backgroundColor: "$color6" }}
                size="lg"
              >
                {loading ? (
                  <Spinner size={20} />
                ) : (
                  <>
                    <Rocket size={20} />
                    Sign up with Hanzo
                  </>
                )}
              </Button>

              <YStack position="relative">
                <XStack position="absolute" top={0} right={0} bottom={0} left={0} alignItems="center">
                  <YStack width="100%" borderTopWidth={1} borderColor="$borderColor"></YStack>
                </XStack>
                <XStack position="relative" justifyContent="center">
                  <SizableText backgroundColor="$background" paddingHorizontal="$2" color="$color11" fontSize="$1">
                    No credit card required
                  </SizableText>
                </XStack>
              </YStack>

              {/* Trust badges */}
              <XStack alignItems="center" justifyContent="center" gap="$5" paddingTop="$2">
                <XStack alignItems="center" gap="$2">
                  <Shield size={16} />
                  <SizableText fontSize="$1" color="$color11">Encrypted &amp; Audited</SizableText>
                </XStack>
                <XStack alignItems="center" gap="$2">
                  <Shield size={16} />
                  <SizableText fontSize="$1" color="$color11">GDPR Ready</SizableText>
                </XStack>
              </XStack>

              {/* Footer Links */}
              <YStack paddingTop="$4" rowGap="$2">
                <Paragraph fontSize="$3" color="$color11" textAlign="center">
                  Already have an account?{' '}
                  <Link href="/login"><SizableText color="$color" textDecorationLine="underline" hoverStyle={{ color: "$color" }}>
                    Sign in
                  </SizableText></Link>
                </Paragraph>
                {/* The documents live on hanzo.ai and are linked, not copied:
                    one home for the legal text, or two copies drift and the
                    agreement stops naming what the user actually agreed to.
                    These were `/terms` and `/privacy` — routes this app does not
                    have, so both 404'd and signup asked people to accept terms
                    they could not open. */}
                <Paragraph fontSize="$1" color="$color11" textAlign="center">
                  By signing up, you agree to our{' '}
                  <Anchor
                    href="https://hanzo.ai/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    textDecorationLine="underline"
                    hoverStyle={{ color: "$color" }}
                  >
                    Terms
                  </Anchor>{' '}
                  and{' '}
                  <Anchor
                    href="https://hanzo.ai/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    textDecorationLine="underline"
                    hoverStyle={{ color: "$color" }}
                  >
                    Privacy Policy
                  </Anchor>
                </Paragraph>
              </YStack>
            </CardContent>
          </Card>
        </YStack>
      </XStack>
    </YStack>
  );
}
