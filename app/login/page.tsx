'use client';

import { SizableText, YStack, XStack, H1, Paragraph, Anchor, H2 } from '@hanzo/gui';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useIam } from '@hanzo/iam/react';
import { HanzoBrand } from '@/components/HanzoLogo';
import { Loader2, Sparkles, Zap, Monitor, Apple, Terminal, Smartphone } from 'lucide-react';

/**
 * /login — HIP-0111 canonical. There is no local credential form: Hanzo IAM
 * owns every credential interaction. On mount we start the OAuth2 PKCE redirect
 * to IAM via the `@hanzo/iam` SDK (`login()`), exactly like hanzo.ai / chat /
 * console. The right-hand panel and the local-runtime download links are
 * app-specific chrome, not auth.
 */
export default function LoginPage() {
  const { login } = useIam();
  const [currentIdea, setCurrentIdea] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

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

  const ideas = [
    'Build a SaaS dashboard with real-time analytics',
    'Create an AI-powered chat application',
    'Design a modern e-commerce platform',
    'Develop a social media scheduler with AI',
    'Build a cryptocurrency trading dashboard',
    'Create a video streaming platform like Netflix',
    'Design a project management tool with AI insights',
    'Build a marketplace for digital products',
    'Create a learning management system',
    'Develop a fitness tracking app with AI coach',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(false);
      setTimeout(() => {
        setCurrentIdea((prev) => (prev + 1) % ideas.length);
        setIsTyping(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [ideas.length]);

  return (
    <YStack minHeight="100%" backgroundColor="$background">
      {/* Navigation */}
      <YStack position="absolute" top="$0" left="$0" right="$0" zIndex={50}>
        <XStack maxWidth={1400} alignSelf="center" paddingHorizontal="$5" paddingVertical="$4.5" alignItems="center" justifyContent="space-between">
          <Link href="/"><XStack alignItems="center">
            <HanzoBrand color="var(--foreground)" markSize={32} />
          </XStack></Link>
        </XStack>
      </YStack>

      {/* Main Content */}
      <XStack minHeight="100%">
        {/* Left Side - Redirecting to IAM */}
        <XStack width="100%" alignItems="center" justifyContent="center" paddingHorizontal="$5" paddingVertical="$11" $lg={{ width: "50%" }}>
          <YStack width="100%" maxWidth={448}>
            <XStack justifyContent="center" marginBottom="$7">
              <HanzoBrand
                color="var(--foreground)"
                markSize={44}
                wordmarkSize={30}
  />
            </XStack>

            <H1 fontSize="$11" fontWeight="500" marginBottom="$4" letterSpacing={-0.4} textAlign="center">Welcome back</H1>
            <Paragraph color="$color11" fontSize="$6" marginBottom="$7" textAlign="center">Taking you to Hanzo ID to sign in</Paragraph>

            <XStack alignItems="center" justifyContent="center" gap="$2" marginBottom="$8">
              <Loader2 size={20} />
              <Paragraph fontSize="$3" color="$color11">Redirecting to secure sign in…</Paragraph>
            </XStack>

            {/* Desktop App Options */}
            <YStack rowGap="$4">
              <Paragraph fontSize="$3" color="$color11" textAlign="center">Run locally without login</Paragraph>

              <YStack gap="$3">
                <Anchor
                  href="https://github.com/hanzoai/app/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  alignItems="center" justifyContent="center" gap="$2" padding="$3.5" backgroundColor="$color3" borderRadius="$6" borderWidth={1} borderColor="$borderColor" group hoverStyle={{ borderColor: "$color06", backgroundColor: "$color4" }}
                >
                  <Monitor size={16} />
                  <SizableText fontSize="$3" color="$color11" $group-hover={{ color: "$color" }}>Windows</SizableText>
                </Anchor>

                <Anchor
                  href="https://github.com/hanzoai/app/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  alignItems="center" justifyContent="center" gap="$2" padding="$3.5" backgroundColor="$color3" borderRadius="$6" borderWidth={1} borderColor="$borderColor" group hoverStyle={{ borderColor: "$color06", backgroundColor: "$color4" }}
                >
                  <Apple size={16} />
                  <SizableText fontSize="$3" color="$color11" $group-hover={{ color: "$color" }}>macOS</SizableText>
                </Anchor>

                <Anchor
                  href="https://github.com/hanzoai/app/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  alignItems="center" justifyContent="center" gap="$2" padding="$3.5" backgroundColor="$color3" borderRadius="$6" borderWidth={1} borderColor="$borderColor" group hoverStyle={{ borderColor: "$color06", backgroundColor: "$color4" }}
                >
                  <Terminal size={16} />
                  <SizableText fontSize="$3" color="$color11" $group-hover={{ color: "$color" }}>Linux</SizableText>
                </Anchor>

                <XStack alignItems="center" justifyContent="center" gap="$2" padding="$3.5" backgroundColor="$color3" borderRadius="$6" borderWidth={1} borderColor="$borderColor" opacity={0.4} cursor="not-allowed">
                  <Smartphone size={16} />
                  <SizableText fontSize="$3" color="$color11">Mobile</SizableText>
                </XStack>
              </YStack>

              <Paragraph fontSize="$1" color="$color11" textAlign="center">
                Mobile coming soon • Local AI models included
              </Paragraph>
            </YStack>
          </YStack>
        </XStack>

        {/* Right Side - Animated Ideas */}
        <YStack display="none" width="50%" alignItems="center" justifyContent="center" paddingHorizontal="$5" paddingVertical="$11" position="relative" overflow="hidden">
          <YStack position="absolute" top={0} right={0} bottom={0} left={0} opacity={0.2}>
            <YStack
              position="absolute" top={0} right={0} bottom={0} left={0}
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
  />
          </YStack>

          <YStack position="absolute" top="25%" right="-14" width={384} height={384} backgroundColor="$color005" borderRadius="$10" filter="blur(130px)" />
          <YStack
            position="absolute" bottom="25%" left="-14" width={384} height={384} backgroundColor="$color005" borderRadius="$10" filter="blur(130px)"
            style={{ animationDelay: '2s' }}
  />

          <YStack position="relative" zIndex={10} maxWidth={576} width="100%">
            <YStack marginBottom="$6">
              <XStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$1.5" backgroundColor="$color3" backdropFilter="blur(4px)" borderRadius="$10" borderWidth={1} borderColor="$borderColor" marginBottom="$5">
                <Sparkles size={16} />
                <SizableText fontSize="$3" color="$color">AI-powered development</SizableText>
              </XStack>

              <H2 fontSize="$10" fontWeight="500" marginBottom="$4">Start building in seconds</H2>

              <Paragraph color="$color11" marginBottom="$6">
                Describe your idea and watch AI bring it to life instantly
              </Paragraph>
            </YStack>

            <YStack backgroundColor="$color3" backdropFilter="blur(4px)" borderRadius="$8" borderWidth={1} borderColor="$borderColor" padding="$5">
              <XStack alignItems="flex-start" gap="$3">
                <YStack width="$2" height="$2" backgroundColor="$color" borderRadius="$10" marginTop="$2" />
                <YStack flex={1}>
                  <Paragraph color="$color11" fontSize="$1" marginBottom="$3">Try something like</Paragraph>
                  <YStack minHeight={60}>
                    <Paragraph
                      fontSize="$7" color="$color" fontWeight="300" {...{ opacity: isTyping ? 1 : 0 }}
                     lineHeight="1.4">
                      {ideas[currentIdea]}
                      <SizableText width="$0.5" height="$5" backgroundColor="$color" marginLeft="$1" />
                    </Paragraph>
                  </YStack>
                </YStack>
              </XStack>

              <YStack marginTop="$5" paddingTop="$5" borderTopWidth={1} borderColor="$borderColor">
                <XStack alignItems="center" justifyContent="flex-end">
                  <XStack alignItems="center" gap="$2" paddingHorizontal="$4.5" paddingVertical="$2.5" backgroundColor="$color5" borderWidth={1} borderColor="$color6" borderRadius="$6">
                    <Zap size={14} />
                    <SizableText color="$background" fontWeight="500" fontSize="$3">Generate</SizableText>
                  </XStack>
                </XStack>
              </YStack>
            </YStack>

            <YStack gap="$5" marginTop="$7">
              <YStack>
                <Paragraph fontSize="$10" fontWeight="300" color="$color" textAlign="center">10k+</Paragraph>
                <Paragraph fontSize="$1" color="$color11" marginTop="$1" textAlign="center">Apps built</Paragraph>
              </YStack>
              <YStack>
                <Paragraph fontSize="$10" fontWeight="300" color="$color" textAlign="center">50ms</Paragraph>
                <Paragraph fontSize="$1" color="$color11" marginTop="$1" textAlign="center">Response time</Paragraph>
              </YStack>
              <YStack>
                <Paragraph fontSize="$10" fontWeight="300" color="$color" textAlign="center">400+</Paragraph>
                <Paragraph fontSize="$1" color="$color11" marginTop="$1" textAlign="center">AI models</Paragraph>
              </YStack>
            </YStack>
          </YStack>
        </YStack>
      </XStack>
    </YStack>
  );
}
