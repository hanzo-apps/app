'use client';

import { SizableText, YStack, XStack, H3, Paragraph } from '@hanzo/ui';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useIam } from '@hanzo/iam/react';
import { EVENTS } from '@hanzo/event';
import { useAnalytics } from '@hanzo/event/react';
import { HanzoLogo } from '@/components/HanzoLogo';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@hanzo/ui';
import { Sparkles, Shield, Rocket } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { accent } from '@/lib/chrome';

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
                  {/* No starter-credit line here. The free $5 grant was
                      retired — onboarding picks a paid plan at hanzo.id — and
                      nothing in this app ever granted it, so the promise was
                      only ever copy. Same call the crypto rail's "bonus
                      credits" got on /billing: if no backend grants it, it
                      does not go on the page. What remains is what signing up
                      actually gets you. */}
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
                {...accent}
                width="100%"
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

              {/* A ruled line sat here carrying the promise that signing up
                  needed no payment method. That stopped being true when
                  onboarding started asking for a plan, and the divider went
                  with it rather than being left to label nothing — it existed
                  only to carry that sentence.

                  Deliberately not quoting the old wording: the ratchet in
                  tests/unit/no-unbacked-credit-claim.test.ts greps source text
                  and cannot tell a quotation from a claim, so a comment that
                  spells it out re-breaks the build. It caught this one. */}

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
