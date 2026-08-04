'use client';

import { XStack, Paragraph } from '@hanzo/gui';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { screen } from '@/lib/chrome';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to dashboard
    // Server mode: middleware handles auth redirect to /admin/login if not authenticated
    router.push('/admin/dashboard');
  }, [router]);

  return (
    <XStack {...screen} backgroundColor="#0a0a0a">
      <Paragraph color="$color8">Redirecting...</Paragraph>
    </XStack>
  );
}
