'use client';

import { SizableText, YStack, Paragraph, XStack, H4, Anchor } from '@hanzo/gui';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { AppShell } from '@/components/app-shell';
import { accent, panel, selected, screen } from '@/lib/chrome';
import { CryptoPayment, CRYPTO_PAYMENTS_ENABLED } from '@/components/crypto-payment';
import { WalletBoundary } from '@/components/providers/WalletBoundary';
import { TopUp, Subscribe } from '@/components/billing/purchase';
import { useCloudBalance, spendableCents } from '@/lib/billing/live-balance';

// UI Components
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Progress } from '@hanzo/ui';

// Icons
import { Wallet, Download, Plus, ExternalLink, Sparkles, TrendingUp, Clock, Activity, Database, Brain, FileText, CreditCard, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

// Types

interface Invoice {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  pdfUrl?: string;
  hostedUrl?: string;
  type: 'card' | 'crypto';
  txHash?: string;
  chain?: string;
}

interface UsageMetric {
  used: number;
  limit: number;
}

interface Usage {
  api_calls: UsageMetric;
  storage: UsageMetric;
  ai_responses: UsageMetric;
}

interface Subscription {
  plan: string;
  status: string;
  nextBillingDate?: string;
  cancelAtPeriodEnd?: boolean;
}

// Credit tiers live in <TopUp> (components/billing/purchase.tsx), next to the
// checkout that sells them, and are amounts rather than bonus "packs" because
// commerce credits exactly the cents charged. There is no second tier table.

// The customer billing portal (the @hanzo/billing SPA) — where an EXISTING
// subscription is managed. Buying is pay.hanzo.ai (lib/pay.ts); managing is
// here. Same host the sidebar wallet already links to.
const BILLING_PORTAL_URL =
  process.env.NEXT_PUBLIC_BILLING_URL || 'https://billing.hanzo.ai';

export default function BillingPage() {
  // Auth is the ONE canonical source: the @hanzo/iam SDK (useUser), not a
  // hand-rolled /api/auth/check probe. `/billing` is also middleware-protected
  // (a live IAM session required), so the client redirect below is only a
  // belt-and-suspenders gate once the SDK has resolved.
  const { user, isAuthenticated: authenticated, loading: authLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !authenticated) router.push('/login');
  }, [authLoading, authenticated, router]);

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');

  // The REAL per-org balance, from the ONE shared live store the sidebar wallet
  // and the usage dialog already read (`/v1/wallet` → gateway
  // `/v1/billing/balance`). This page used to keep its own `credits` number fed
  // by a Commerce endpoint that does not exist, so it always rendered 0 no
  // matter what the ledger said. One ledger, one reader.
  const { phase: balancePhase, balance, refresh: refreshBalance } = useCloudBalance();
  const balanceCents = spendableCents(balance);

  // Billing data
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<Usage>({
    api_calls: { used: 0, limit: 10000 },
    storage: { used: 0, limit: 100 },
    ai_responses: { used: 0, limit: 1000 },
  });

  const fetchBillingData = useCallback(async () => {
    try {
      // Fetch usage data
      const usageResponse = await fetch('/v1/usage');
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        if (usageData.usage?.api_calls) {
          setUsage(usageData.usage);
        }
      }

      // Fetch subscription status
      const subResponse = await fetch('/v1/commerce/subscription');
      if (subResponse.ok) {
        const subData = await subResponse.json();
        if (subData.subscription) {
          setSubscription({
            plan: subData.subscription.plan || 'Pay as you go',
            status: subData.subscription.status || 'active',
            nextBillingDate: subData.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subData.subscription.cancelAtPeriodEnd,
          });
        } else {
          setSubscription({ plan: 'Pay as you go', status: 'active' });
        }
      } else {
        setSubscription({ plan: 'Pay as you go', status: 'active' });
      }

      // Fetch invoices from Hanzo Commerce
      const invoiceResponse = await fetch('/v1/commerce/invoices');
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json();
        if (invoiceData.invoices) {
          setInvoices(invoiceData.invoices.map((inv: any) => ({
            ...inv,
            type: 'card' as const,
          })));
        }
      }

      // The balance is NOT fetched here — `useCloudBalance` owns it, live.
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setSubscription({ plan: 'Pay as you go', status: 'active' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchBillingData();
    }
  }, [authenticated, fetchBillingData]);

  const handleCryptoPaymentSuccess = (txHash: string, creditsAdded: number) => {
    // Re-read the ledger rather than adding to a local number: the balance we
    // show must be the balance the gateway will debit, never an optimistic
    // guess that drifts from it.
    refreshBalance();
    setCreditModalOpen(false);

    // Add to local invoice list
    setInvoices(prev => [{
      id: txHash,
      description: `${creditsAdded.toLocaleString()} credits (USDC)`,
      amount: creditsAdded <= 1000 ? 10 : creditsAdded <= 2750 ? 25 : creditsAdded <= 6000 ? 50 : 100,
      date: new Date().toISOString(),
      status: 'paid',
      type: 'crypto',
      txHash,
    }, ...prev]);
  };

  // Card checkout is a plain navigation to the ONE live Square surface — see
  // <TopUp>/<Subscribe> in components/billing/purchase.tsx. There is no
  // "create a session" round-trip here any more: the version that lived here
  // POSTed to /api/commerce/checkout, which 503'd (no webhook secret on this
  // deployment) or 404'd (Commerce has no /v1/checkout/charge), and then
  // swallowed the failure into console.error — which is precisely why the Buy
  // buttons appeared to do nothing at all.

  // Managing an existing subscription is the billing PORTAL's job — the live
  // @hanzo/billing SPA over the same commerce backend. hanzo.app does not
  // reimplement it. (The /api/commerce/portal round-trip this replaces asked
  // Commerce for a portal URL via an endpoint that does not exist, got nothing,
  // and silently did nothing — the same failure as the Buy buttons.)
  const handleManageSubscription = () => {
    window.location.href = `${BILLING_PORTAL_URL}/subscriptions`;
  };

  // Returning from checkout: re-read the ledger. We deliberately do NOT trust a
  // `credits=` query param to move the displayed balance — anyone can type one,
  // and the only number worth showing is the one the gateway will debit.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true' || params.get('paid') === 'true') {
      refreshBalance();
      window.history.replaceState({}, '', '/billing');
    }
  }, [refreshBalance]);

  const calculateUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (authLoading || loading) {
    return (
      <XStack {...screen} backgroundColor="$background">
        <Spinner size={32} />
      </XStack>
    );
  }

  return (
    <AppShell
      currentView="billing"
      title="Billing"
      subtitle={user?.email ? `Credits, subscription and usage for ${user.email}` : "Credits, subscription and usage"}
      actions={
        <Button {...accent} onClick={() => setActiveTab('add-credits')}>
          <Plus size={16} />
          Add Credits
        </Button>
      }
    >
        {/* Key Metrics */}
        <YStack gap="$5" marginBottom="$6">
          {/* Current Plan */}
          <Card {...panel} hoverStyle={{ borderColor: "$color6" }}>
            <CardHeader paddingBottom="$3">
              <CardTitle fontSize="$3" fontWeight="500" color="$color11">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <YStack rowGap="$3">
                <Badge variant={subscription?.plan === 'Pro' ? 'default' : 'secondary'}>
                  {subscription?.plan || 'Free'}
                </Badge>
                {subscription?.nextBillingDate && (
                  <Paragraph fontSize="$1" color="$color11">
                    Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                  </Paragraph>
                )}
                {subscription?.cancelAtPeriodEnd && (
                  <Paragraph fontSize="$1" color="$yellow8">Cancels at period end</Paragraph>
                )}
                <XStack gap="$2">
                  {(!subscription || subscription.plan === 'Pay as you go') ? (
                    /* Straight to the card form at the catalog price — the same
                       checkout the plans page uses. No pricing↔billing ping-pong. */
                    <Subscribe slug="pro" />
                  ) : (
                    <Button
                      onClick={handleManageSubscription}
                      variant="outline"
                      width="100%" borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}
                      size="sm"
                    >
                      Manage Subscription
                    </Button>
                  )}
                </XStack>
              </YStack>
            </CardContent>
          </Card>

          {/* Credits */}
          <Card {...panel} hoverStyle={{ borderColor: "$color6" }}>
            <CardHeader paddingBottom="$3">
              <CardTitle fontSize="$3" fontWeight="500" color="$color11">Credit Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <YStack rowGap="$3">
                <XStack alignItems="center" justifyContent="space-between">
                  {/* The real per-org ledger, in the currency it is actually
                      denominated in (USD). Honest states: never a placeholder
                      number standing in for an unknown balance. */}
                  <SizableText fontSize="$8" fontWeight="500">
                    {balancePhase === 'ready' && balanceCents !== null
                      ? `$${(balanceCents / 100).toFixed(2)}`
                      : balancePhase === 'loading' || balancePhase === 'idle'
                        ? '—'
                        : balancePhase === 'noauth'
                          ? 'Sign in'
                          : 'Unavailable'}
                  </SizableText>
                  <TrendingUp size={20} />
                </XStack>
                <Paragraph fontSize="$1" color="$color11">
                  Spendable credit across every Hanzo service
                </Paragraph>
                <Button
                  onClick={() => setActiveTab('add-credits')}
                  variant="outline"
                  size="sm"
                  width="100%" borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}
                >
                  <Plus size={16} />
                  Add Credit
                </Button>
              </YStack>
            </CardContent>
          </Card>

          {/* Usage Summary */}
          <Card {...panel} hoverStyle={{ borderColor: "$color6" }}>
            <CardHeader paddingBottom="$3">
              <CardTitle fontSize="$3" fontWeight="500" color="$color11">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <YStack rowGap="$2">
                <XStack justifyContent="space-between">
                  <SizableText fontSize="$3" color="$color11">API Calls</SizableText>
                  <SizableText fontSize="$3">{(usage.api_calls?.used ?? 0).toLocaleString()}</SizableText>
                </XStack>
                <XStack justifyContent="space-between">
                  <SizableText fontSize="$3" color="$color11">AI Responses</SizableText>
                  <SizableText fontSize="$3">{(usage.ai_responses?.used ?? 0).toLocaleString()}</SizableText>
                </XStack>
                <XStack justifyContent="space-between">
                  <SizableText fontSize="$3" color="$color11">Storage</SizableText>
                  <SizableText fontSize="$3">{usage.storage?.used ?? 0} GB</SizableText>
                </XStack>
              </YStack>
            </CardContent>
          </Card>
        </YStack>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} width="100%">
          <XStack marginBottom="$5" flexWrap="wrap" alignItems="center" gap="$3" borderBottomWidth={1} borderColor="$borderColor" paddingBottom="$3">
          <TabsList backgroundColor="transparent" padding="$0">
            <TabsTrigger value="overview" {...selected(activeTab === "overview")}>Overview</TabsTrigger>
            <TabsTrigger value="add-credits" {...selected(activeTab === "add-credits")}>Add Credits</TabsTrigger>
            <TabsTrigger value="history" {...selected(activeTab === "history")}>History</TabsTrigger>
            <TabsTrigger value="usage" {...selected(activeTab === "usage")}>Usage</TabsTrigger>
          </TabsList>
          </XStack>

          {/* Overview Tab */}
          <TabsContent value="overview" marginTop="$5" rowGap="$5">
            <Card {...panel}>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent gap="$3">
                {CRYPTO_PAYMENTS_ENABLED && (
                  <Button
                    {...accent}
                    onClick={() => { setPaymentMethod('crypto'); setCreditModalOpen(true); }}
                  >
                    <Wallet size={16} />
                    Pay with USDC
                  </Button>
                )}
                <Button
                  variant="outline"
                  borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}
                  onClick={() => setActiveTab('add-credits')}
                >
                  <CreditCard size={16} />
                  Pay with Card
                </Button>
                <Button
                  variant="outline"
                  borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}
                  onClick={() => router.push('/pricing')}
                >
                  <Sparkles size={16} />
                  View Plans
                </Button>
                <Button
                  variant="outline"
                  borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}
                  onClick={() => setActiveTab('usage')}
                >
                  <Activity size={16} />
                  Usage Stats
                </Button>
              </CardContent>
            </Card>

            {/* Recent transactions in overview */}
            <Card {...panel}>
              <CardHeader flexDirection="row" alignItems="center" justifyContent="space-between">
                <CardTitle>Recent Transactions</CardTitle>
                {invoices.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('history')}
                  >
                    View All <ArrowRight size={16} />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <YStack alignItems="center" paddingVertical="$8">
                    <FileText size={48} />
                    <Paragraph color="$color11" marginBottom="$1" textAlign="center">No transactions yet</Paragraph>
                    <Paragraph fontSize="$3" color="$color11" textAlign="center">Purchase credits to see your transaction history</Paragraph>
                  </YStack>
                ) : (
                  <YStack rowGap="$3">
                    {invoices.slice(0, 3).map((invoice) => (
                      <TransactionRow key={invoice.id} invoice={invoice} />
                    ))}
                  </YStack>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Credits Tab */}
          <TabsContent value="add-credits" marginTop="$5" rowGap="$5">
            {/* Payment method toggle — only when crypto is live; otherwise card-only
                (paymentMethod stays 'card', so the USDC section + modal never show). */}
            {CRYPTO_PAYMENTS_ENABLED && (
            <XStack gap="$2" padding="$1" backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$5" width="fit-content">
              <Button
                onClick={() => setPaymentMethod('card')}
                variant={paymentMethod === 'card' ? 'secondary' : 'ghost'}
                paddingHorizontal="$4" paddingVertical="$2" borderRadius="$3"
              >
                <CreditCard size={16} />
                Credit Card
              </Button>
              <Button
                onClick={() => setPaymentMethod('crypto')}
                variant={paymentMethod === 'crypto' ? 'secondary' : 'ghost'}
                paddingHorizontal="$4" paddingVertical="$2" borderRadius="$3"
              >
                <Wallet size={16} />
                USDC
              </Button>
            </XStack>
            )}

            {/* Card is the only live rail. The USDC grid that used to sit here
                was unreachable (CRYPTO_PAYMENTS_ENABLED is false, so the toggle
                never renders and paymentMethod never leaves 'card') and it
                advertised bonus credits no backend grants. */}
            <TopUp />
          </TabsContent>

          {/* History / Invoices Tab */}
          <TabsContent value="history" marginTop="$5">
            <Card {...panel}>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All payments, invoices, and crypto transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <YStack alignItems="center" paddingVertical="$8">
                    <FileText size={48} />
                    <Paragraph color="$color11" marginBottom="$1" textAlign="center">No transactions yet</Paragraph>
                    <Paragraph fontSize="$3" color="$color11" textAlign="center">Purchase credits to see your transaction history</Paragraph>
                  </YStack>
                ) : (
                  <YStack rowGap="$3">
                    {invoices.map((invoice) => (
                      <TransactionRow key={invoice.id} invoice={invoice} />
                    ))}
                  </YStack>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" marginTop="$5" rowGap="$5">
            <Card {...panel}>
              <CardHeader>
                <CardTitle>Usage Details</CardTitle>
                <CardDescription>Current billing period usage across all services</CardDescription>
              </CardHeader>
              <CardContent rowGap="$5">
                {/* API Calls */}
                <div>
                  <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                    <XStack alignItems="center">
                      <Activity size={16} />
                      <span>API Calls</span>
                    </XStack>
                    <SizableText fontSize="$3" color="$color11">
                      {(usage.api_calls?.used ?? 0).toLocaleString()} / {(usage.api_calls?.limit ?? 0).toLocaleString()}
                    </SizableText>
                  </XStack>
                  <Progress
                    value={calculateUsagePercentage(usage.api_calls?.used ?? 0, usage.api_calls?.limit ?? 0)}
                    height="$2" backgroundColor="$color3"
                    indicatorClassName={getUsageColor(calculateUsagePercentage(usage.api_calls?.used ?? 0, usage.api_calls?.limit ?? 0))}
  />
                </div>

                {/* AI Responses */}
                <div>
                  <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                    <XStack alignItems="center">
                      <Brain size={16} />
                      <span>AI Responses</span>
                    </XStack>
                    <SizableText fontSize="$3" color="$color11">
                      {(usage.ai_responses?.used ?? 0).toLocaleString()} / {(usage.ai_responses?.limit ?? 0).toLocaleString()}
                    </SizableText>
                  </XStack>
                  <Progress
                    value={calculateUsagePercentage(usage.ai_responses?.used ?? 0, usage.ai_responses?.limit ?? 0)}
                    height="$2" backgroundColor="$color3"
                    indicatorClassName={getUsageColor(calculateUsagePercentage(usage.ai_responses?.used ?? 0, usage.ai_responses?.limit ?? 0))}
  />
                </div>

                {/* Storage */}
                <div>
                  <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                    <XStack alignItems="center">
                      <Database size={16} />
                      <span>Storage</span>
                    </XStack>
                    <SizableText fontSize="$3" color="$color11">
                      {usage.storage?.used ?? 0} GB / {usage.storage?.limit ?? 0} GB
                    </SizableText>
                  </XStack>
                  <Progress
                    value={calculateUsagePercentage(usage.storage?.used ?? 0, usage.storage?.limit ?? 0)}
                    height="$2" backgroundColor="$color3"
                    indicatorClassName={getUsageColor(calculateUsagePercentage(usage.storage?.used ?? 0, usage.storage?.limit ?? 0))}
  />
                </div>

                {/* Credit consumption */}
                <YStack paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                  <H4 fontSize="$3" fontWeight="500" color="$color11" marginBottom="$3">Credit Consumption</H4>
                  <YStack gap="$4">
                    <YStack padding="$3" borderRadius="$5" backgroundColor="$background" borderWidth={1} borderColor="$borderColor">
                      <SizableText fontSize="$6" fontWeight="500" textAlign="center">{usage.ai_responses?.used ?? 0}</SizableText>
                      <SizableText fontSize="$1" color="$color11" textAlign="center">AI credits used</SizableText>
                    </YStack>
                    <YStack padding="$3" borderRadius="$5" backgroundColor="$background" borderWidth={1} borderColor="$borderColor">
                      <SizableText fontSize="$6" fontWeight="500" textAlign="center">
                        {balancePhase === 'ready' && balanceCents !== null
                          ? `$${(balanceCents / 100).toFixed(2)}`
                          : '--'}
                      </SizableText>
                      <SizableText fontSize="$1" color="$color11" textAlign="center">Credit remaining</SizableText>
                    </YStack>
                  </YStack>
                </YStack>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Crypto Payment Modal — web3 stack (wagmi/WalletConnect/Coinbase) scoped here.
          Gated off while crypto is killed (open can never be true anyway). */}
      <WalletBoundary>
        <CryptoPayment
          open={CRYPTO_PAYMENTS_ENABLED && creditModalOpen && paymentMethod === 'crypto'}
          onOpenChange={(open) => {
            setCreditModalOpen(open);
            if (!open) setPaymentMethod('card');
          }}
          onSuccess={handleCryptoPaymentSuccess}
  />
      </WalletBoundary>
    </AppShell>
  );
}

// Transaction row component
function TransactionRow({ invoice }: { invoice: Invoice }) {
  const statusIcon = invoice.status === 'paid' ? (
    <CheckCircle2 size={16} />
  ) : invoice.status === 'failed' ? (
    <XCircle size={16} />
  ) : (
    <Clock size={16} />
  );

  const explorerBaseUrl = invoice.chain === 'ethereum'
    ? 'https://etherscan.io'
    : invoice.chain === 'arbitrum'
    ? 'https://arbiscan.io'
    : 'https://basescan.org';

  return (
    <XStack alignItems="center" justifyContent="space-between" padding="$4" borderWidth={1} borderColor="$borderColor" borderRadius="$5" hoverStyle={{ backgroundColor: "$color3" }}>
      <XStack alignItems="center" gap="$3">
        {statusIcon}
        <div>
          <XStack alignItems="center" gap="$2">
            <Paragraph fontWeight="500">{invoice.description || 'Payment'}</Paragraph>
            <Badge variant="secondary">
              {invoice.type === 'crypto' ? 'USDC' : 'Card'}
            </Badge>
          </XStack>
          <Paragraph fontSize="$3" color="$color11">
            {new Date(invoice.date).toLocaleDateString()} -- ${invoice.amount.toFixed(2)}
          </Paragraph>
        </div>
      </XStack>
      <XStack alignItems="center" gap="$2">
        {invoice.type === 'crypto' && invoice.txHash && (
          <Anchor
            href={`${explorerBaseUrl}/tx/${invoice.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            color="$color11" hoverStyle={{ color: "$color" }}
          >
            <ExternalLink size={16} />
          </Anchor>
        )}
        {invoice.type === 'card' && (invoice.pdfUrl || invoice.hostedUrl) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(invoice.pdfUrl || invoice.hostedUrl, '_blank')}
          >
            <Download size={16} />
          </Button>
        )}
      </XStack>
    </XStack>
  );
}
