'use client';

/** The usage screen's markup. The page around it stays a server component so it
 *  can read the request's IAM session; only the view needs the client. */
import { SizableText, YStack, H1, Paragraph, XStack } from '@hanzo/gui';
import Link from 'next/link';
import { Activity, ExternalLink } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@hanzo/ui';

import { AppShell } from '@/components/app-shell';
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
    <AppShell currentView="usage">
    <YStack flex={1} backgroundColor="$background" overflow="scroll">
      <YStack maxWidth={1024} alignSelf="center" paddingHorizontal="$4" paddingVertical="$6" $md={{ paddingHorizontal: "$6", paddingVertical: "$8" }}>
        <YStack justifyContent="space-between" alignItems="flex-start" gap="$4" marginBottom="$6" $sm={{ flexDirection: "row", alignItems: "center" }}>
          <div>
            <H1 fontSize="$10" fontWeight="500" marginBottom="$2" $md={{ fontSize: "$11" }} lineHeight="1.1">Usage</H1>
            <Paragraph color="$color11">
              Your account consumption
              {email && <SizableText marginLeft="$2" color="$color11">({email})</SizableText>}
            </Paragraph>
          </div>
          <Link href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}>
              <ExternalLink size={16} />
              Multi-provider dashboard
            </Button>
          </Link>
        </YStack>

        {/* Smart routing — explains the value and toggles the builder default. */}
        <SmartRoutingCard />

        {/* Account usage — real figures from the Hanzo Base data plane. */}
        <Card backgroundColor="$background" borderColor="$borderColor" marginBottom="$5">
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
      </YStack>
    </YStack>
    </AppShell>
  );
}
