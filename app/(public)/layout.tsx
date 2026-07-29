'use client';

import { YStack } from '@hanzo/gui';
import Navigation from "@/components/public/navigation";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <YStack minHeight="100%" backgroundColor="black" zIndex={1} position="relative">
      <YStack className="background__noisy" />
      <Navigation />
      {children}
    </YStack>
  );
}
