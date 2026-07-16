import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Activity, ExternalLink } from 'lucide-react';

import { isAuthenticated } from '@/lib/auth';
import { listProjects } from '@/lib/db/projects';
import { buildUsage } from '@/lib/usage';
import Header from '@/components/layout/header';
import SmartRoutingCard from '@/components/usage/smart-routing-card';
import CloudUsagePanel from '@/components/usage/cloud-usage-panel';
import { Button } from '@hanzo/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@hanzo/ui';

// Reads the caller's cookies/token — must render per-request.
export const dynamic = 'force-dynamic';

export default async function UsagePage() {
  const user = await isAuthenticated();
  if (!user) redirect('/login');

  let projectCount = 0;
  try {
    projectCount = (await listProjects(user.token, user.id)).length;
  } catch {
    projectCount = 0;
  }

  const account = buildUsage(projectCount);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Usage</h1>
            <p className="text-white/60">
              Your account consumption
              {user.email && <span className="ml-2 text-white/40">({user.email})</span>}
            </p>
          </div>
          <Link href="https://console.hanzo.ai/ai-accounts" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ExternalLink className="w-4 h-4 mr-2" />
              Multi-provider dashboard
            </Button>
          </Link>
        </div>

        {/* Smart routing — explains the value and toggles the builder default. */}
        <SmartRoutingCard />

        {/* Account usage — real figures from the Hanzo Base data plane. */}
        <Card className="bg-[#1a1a1a] border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-white/60" />
              Account
            </CardTitle>
            <CardDescription>Current, known-good figures for your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {account.metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-white/80">{m.label}</span>
                <span className="font-medium">
                  {m.value.toLocaleString()}
                  {m.unit ? ` ${m.unit}` : ''}
                  {typeof m.limit === 'number' ? ` / ${m.limit.toLocaleString()}` : ''}
                </span>
              </div>
            ))}
            {!account.metered && account.note && (
              <p className="text-sm text-white/40 pt-2 border-t border-white/10">{account.note}</p>
            )}
          </CardContent>
        </Card>

        {/* Cloud usage — the ONE canonical <UsagePanel> over GET /v1/get-cloud-usages
            (spend, tokens, requests, per-model, activity). Same component every
            Hanzo surface renders; reads this session's IAM bearer. */}
        <CloudUsagePanel />
      </div>
    </div>
  );
}
