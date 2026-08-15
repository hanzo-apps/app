'use client';

import { SizableText, YStack, XStack, H1, Paragraph } from '@hanzo/ui';
import { PrimaryButton } from '@hanzo/ui/product';
// `Anchor` is not on @hanzo/ui's barrel yet — the dts build drops it, the
// same way it drops the GuiElement type. Tracked; everything else in this
// file comes from @hanzo/ui.
import { Anchor } from '@hanzo/gui';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useIam } from '@hanzo/iam/react';
import { HanzoBrand } from '@/components/HanzoLogo';
import { Monitor, Apple, Terminal } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import HeroPreview from '@/components/landing/hero-preview';
import LazySection from '@/components/landing/lazy-section';

// Below the fold, the same two sections the landing page uses and by the same
// mechanism: code-split, mounted on approach. A visitor who stays long enough
// to scroll gets the proof and the three steps; one who is redirected in
// 300ms never pays for either chunk.
const LogoWall = dynamic(() => import('@/components/landing/logo-wall'), { ssr: false });
const HowItWorks = dynamic(() => import('@/components/landing/how-it-works'), { ssr: false });

const RELEASES = 'https://github.com/hanzoai/app/releases/latest';
const DESKTOP = [
  { Icon: Monitor, label: 'Windows' },
  { Icon: Apple, label: 'macOS' },
  { Icon: Terminal, label: 'Linux' },
];

/**
 * /login — HIP-0111 canonical. There is no local credential form: Hanzo IAM
 * owns every credential interaction. On mount we start the OAuth2 PKCE redirect
 * to IAM via the `@hanzo/iam` SDK (`login()`), exactly like hanzo.ai / chat /
 * console. Everything else on the page is product, not auth.
 *
 * The redirect is instant when IAM is reachable and this page is a flash. When
 * it is slow — or refused, which is what a blocked host or a stale client looks
 * like — the visitor lands here and stays, so the page states the one action in
 * a control they can press (the SAME `login()`) rather than leaving them
 * watching a spinner with nothing to do.
 */
export default function LoginPage() {
  const { login } = useIam();

  useEffect(() => {
    // Honor a `?redirect=<path>` deep link (middleware stamps it when bouncing
    // a protected route here) so the post-login callback returns the user
    // there. Same-origin absolute paths only — never a protocol-relative /
    // off-origin target. The callback re-guards via loginRedirectDestination.
    try {
      const r = new URLSearchParams(window.location.search).get('redirect');
      if (r && r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/\\')) {
        window.localStorage.setItem('redirectAfterLogin', r);
      }
    } catch {
      /* storage / URL unavailable */
    }
    login();
  }, [login]);

  return (
    <YStack minHeight="100%" backgroundColor="$background">
      <XStack width="100%" maxWidth={1200} alignSelf="center" paddingHorizontal="$5" paddingVertical="$4.5">
        <Link href="/"><HanzoBrand color="var(--foreground)" markSize={32} /></Link>
      </XStack>

      {/* The fold, laid out the way the landing's is: the sentence and the one
          action on the left, the product on the right. A phone stacks them, so
          the sign-in control is above the demo rather than beside it. */}
      <YStack paddingHorizontal="$4" paddingTop="$6" paddingBottom="$10" $md={{ paddingHorizontal: "$6" }}>
        <YStack alignSelf="center" width="100%" maxWidth={768} gap="$7" $lg={{ flexDirection: "row", alignItems: "center", maxWidth: 1200, gap: "$8" }}>
          <YStack alignSelf="center" width="100%" maxWidth={448} $lg={{ flex: 1, maxWidth: 480 }}>
            <H1 fontSize="$9" $md={{ fontSize: "$11" }} fontWeight="500" letterSpacing={-0.4} textAlign="center" $lg={{ textAlign: "left" }}>
              Welcome back
            </H1>
            <Paragraph marginTop="$3" fontSize="$5" color="$color11" lineHeight="1.5" textAlign="center" $lg={{ textAlign: "left" }}>
              Hanzo ID signs you in — one account for the builder, Hanzo Chat
              and the API.
            </Paragraph>

            {/* The one white, high-emphasis action, wearing the same recipe as
                the header's "Get started" — it is the same door. */}
            <PrimaryButton onClick={() => login()} size="lg" width="100%" marginTop="$6">
              Continue to Hanzo ID
            </PrimaryButton>

            <XStack marginTop="$3" alignItems="center" justifyContent="center" gap="$2">
              <Spinner size={14} />
              <Paragraph fontSize="$1" color="$color11">Redirecting to secure sign in…</Paragraph>
            </XStack>

            <Paragraph marginTop="$5" fontSize="$3" color="$color11" textAlign="center">
              New here?{' '}
              <Link href="/signup"><SizableText fontSize="$3" color="$color" textDecorationLine="underline">Create an account</SizableText></Link>
            </Paragraph>

            <YStack marginTop="$8" paddingTop="$6" borderTopWidth={1} borderColor="$borderColor" gap="$3">
              <Paragraph fontFamily="$mono" fontSize="$1" color="$color11" textAlign="center" $lg={{ textAlign: "left" }}>
                Or run Hanzo on your own machine
              </Paragraph>
              <XStack gap="$2">
                {DESKTOP.map(({ Icon, label }) => (
                  <Anchor
                    key={label}
                    display="flex"
                    href={RELEASES}
                    target="_blank"
                    rel="noopener noreferrer"
                    flexGrow={1} flexBasis={0} minWidth={0} alignItems="center" justifyContent="center" gap="$2" paddingVertical="$2.5" backgroundColor="$color3" borderRadius="$6" borderWidth={1} borderColor="$borderColor" group hoverStyle={{ borderColor: "$color06", backgroundColor: "$color4" }}
                  >
                    <Icon size={14} />
                    <SizableText fontSize="$1" color="$color11" $group-hover={{ color: "$color" }}>{label}</SizableText>
                  </Anchor>
                ))}
              </XStack>
            </YStack>
          </YStack>

          {/* The builder, building — the landing's own frame, not a picture of
              it and not a second mock composer. There is no composer here to
              fill, and to build you sign in, so its "Build <app> →" link opens
              the same door the button does. */}
          <YStack alignSelf="center" width="100%" minWidth={0} $lg={{ flex: 1, minWidth: 0 }}>
            <HeroPreview ask={() => login()} />
          </YStack>
        </YStack>
      </YStack>

      <LazySection minHeight={180}><LogoWall /></LazySection>
      <LazySection minHeight={320}><HowItWorks /></LazySection>
    </YStack>
  );
}
