"use client";

import { YStack, XStack, Paragraph, SizableText, Anchor, type GuiElement, type GuiTextElement } from '@hanzo/gui';
import { useRef, useState } from "react";
import Link from "next/link";
import { useMount, useUnmount } from "react-use";
import { Button } from '@hanzo/ui';
import { HanzoLogo } from "@/components/HanzoLogo";
import { useUser } from "@/hooks/useUser";
import { UserMenu } from "@/components/user-menu";
import { glass } from "@/lib/chrome";

const navigationLinks = [
  {
    name: "Create Website",
    href: "/dev",
  },
  {
    name: "Gallery",
    href: "/gallery",
  },
  {
    name: "Features",
    href: "#features",
  },
  {
    name: "Community",
    href: "#community",
  },
  {
    name: "Deploy",
    href: "#deploy",
  },
];

export default function Navigation() {
  const { openLoginWindow, user } = useUser();
  const [hash, setHash] = useState("");

  const selectorRef = useRef<GuiElement>(null);
  const linksRef = useRef<GuiTextElement[]>(
    new Array(navigationLinks.length).fill(null)
  );
  const [isScrolled, setIsScrolled] = useState(false);

  useMount(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100);
    };

    const initialHash = window.location.hash;
    if (initialHash) {
      setHash(initialHash);
      calculateSelectorPosition(initialHash);
    }

    window.addEventListener("scroll", handleScroll);
  });

  useUnmount(() => {
    window.removeEventListener("scroll", () => {});
  });

  const handleClick = (href: string) => {
    setHash(href);
    calculateSelectorPosition(href);
  };

  const calculateSelectorPosition = (href: string) => {
    const sel = selectorRef.current;
    const index = navigationLinks.findIndex((l) => l.href === href);
    const targetLink = linksRef.current[index];
    if (!(sel instanceof HTMLElement) || !(targetLink instanceof HTMLElement)) return;
    const targetRect = targetLink.getBoundingClientRect();
    sel.style.left = targetRect.left + "px";
    sel.style.width = targetRect.width + "px";
  };

  return (
    // Clear over the hero, glass once you have scrolled off it. The two halves
    // used to disagree: the blur was unconditional and only the TINT waited for
    // `isScrolled`, so at the top the bar was a blur with no ground under it —
    // the hero smeared behind an invisible band. Now the material arrives whole
    // or not at all, and when it arrives it is the same glass every other bar in
    // the app wears rather than this file's own blur(12px).
    <YStack
      position="sticky" top="$0" zIndex={10} {...(isScrolled ? glass(2) : {})}
    >
      <YStack padding="$4" maxWidth={1280} alignSelf="center" paddingHorizontal="$4" $sm={{ paddingHorizontal: "$5" }}>
        <Link href="/"><XStack alignItems="center" gap="$2">
          <HanzoLogo size={36} color="var(--foreground)" />
          <Paragraph fontFamily="$body" color="$color" fontSize="$7" fontWeight="500" lineHeight="1.4">Hanzo</Paragraph>
        </XStack></Link>
        <YStack alignItems="center" justifyContent="center" gap="$5" display="none">
          {navigationLinks.map((link) => (
            <SizableText
              key={link.name}
              ref={(el) => {
                const index = navigationLinks.findIndex(
                  (l) => l.href === link.href
                );
                if (el && linksRef.current[index] !== el) {
                  linksRef.current[index] = el;
                }
              }}
              fontFamily="$body" fontSize="$3"
            >
              {'external' in link && link.external ? (
                <Anchor
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="$color11" hoverStyle={{ color: "$color12" }}
                >
                  {link.name}
                </Anchor>
              ) : (
                <Link
                  href={link.href}

                  onClick={() => {
                    handleClick(link.href);
                  }}
                ><SizableText color="$color11" hoverStyle={{ color: "$color12" }}>
                  {link.name}
                </SizableText></Link>
              )}
            </SizableText>
          ))}
          <XStack
            ref={selectorRef}
            height="$1" position="absolute" bottom="$4" alignItems="center" justifyContent="center" {...{ opacity: !hash ? 0 : undefined }}
          >
            <YStack width="$1" height="$1" backgroundColor="$color" borderRadius="$10" />
          </XStack>
        </YStack>
        <XStack alignItems="center" justifyContent="flex-end" gap="$2">
          {user ? (
            <UserMenu />
          ) : (
            <>
              <Link href="/login">
                <Button variant="link" size={"sm"}>
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size={"sm"}>Sign Up</Button>
              </Link>
            </>
          )}
        </XStack>
      </YStack>
    </YStack>
  );
}
