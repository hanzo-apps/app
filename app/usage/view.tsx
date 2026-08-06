'use client';

/** The usage screen's markup. The page around it stays a server component so it
 *  can read the request's IAM session; only the view needs the client. */
import { SizableText, YStack, Paragraph, XStack } from '@hanzo/ui';
import Link from 'next/link';
import { Activity, ExternalLink } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@hanzo/ui';

import { AppShell } from '@/components/app-shell';
import { panel } from '@/lib/chrome';
import SmartRoutingCard from '@/components/usage/smart-routing-card';
import CloudUsagePanel from '@/components/usage/cloud-usage-panel';
import type { buildUsage } from '@/lib/usage';

export default function UsageView({
  email,
  account,
}: {
  email?: string;
  account: ReturnType<typeof buildUsage>;
}) {
  return (
    <AppShell
      currentView="usage"
      title="Usage"
      subtitle={email ? `Your account consumption (${email})` : "Your account consumption"}
      actions={
        <Link href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            <ExternalLink size={16} />
            Multi-provider dashboard
          </Button>
        </Link>
      }
    >

        {/* Smart routing — explains the value and toggles the builder default. */}
        <SmartRoutingCard />

        {/* Account usage — real figures from the Hanzo Base data plane. */}
        <Card {...panel} marginBottom="$5">
          <CardHeader>
            <CardTitle display="flex" alignItems="center" gap="$2">
              <Activity size={16} />
              Account
            </CardTitle>
            <CardDescription>Current, known-good figures for your account</CardDescription>
          </CardHeader>
          <CardContent rowGap="$4">
            {account.metrics.map((m) => (
              <XStack key={m.label} alignItems="center" justifyContent="space-between">
                <SizableText color="$color">{m.label}</SizableText>
                <SizableText fontWeight="500">
                  {m.value.toLocaleString()}
                  {m.unit ? ` ${m.unit}` : ''}
                  {typeof m.limit === 'number' ? ` / ${m.limit.toLocaleString()}` : ''}
                </SizableText>
              </XStack>
            ))}
            {!account.metered && account.note && (
              <Paragraph fontSize="$3" color="$color11" paddingTop="$2" borderTopWidth={1} borderColor="$borderColor">{account.note}</Paragraph>
            )}
          </CardContent>
        </Card>

        {/* Cloud usage — the ONE canonical <UsagePanel> over GET /v1/get-cloud-usages
            (spend, tokens, requests, per-model, activity). Same component every
            Hanzo surface renders; reads this session's IAM bearer. */}
        <CloudUsagePanel />
    </AppShell>
  );
}
