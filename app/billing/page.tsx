'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { AppShell } from '@/components/app-shell';
import { CryptoPayment, CRYPTO_PAYMENTS_ENABLED } from '@/components/crypto-payment';
import { WalletBoundary } from '@/components/providers/WalletBoundary';
import { TopUp, Subscribe } from '@/components/billing/purchase';
import { useCloudBalance, spendableCents } from '@/lib/billing/live-balance';

// UI Components
import { Button } from "@hanzo/ui-shadcn";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hanzo/ui-shadcn";
import { Badge } from "@hanzo/ui-shadcn";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@hanzo/ui-shadcn";
import { Progress } from "@hanzo/ui-shadcn";

// Icons
import {
  Wallet,
  Download,
  Plus,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Clock,
  Activity,
  Database,
  Brain,
  Loader2,
  FileText,
  Zap,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

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
      const usageResponse = await fetch('/api/usage');
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        if (usageData.usage?.api_calls) {
          setUsage(usageData.usage);
        }
      }

      // Fetch subscription status
      const subResponse = await fetch('/api/commerce/subscription');
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
      const invoiceResponse = await fetch('/api/commerce/invoices');
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
      <div className="min-h-screen bg-card text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <AppShell currentView="billing">
    <div className="flex-1 overflow-y-auto bg-card text-foreground">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-medium mb-2">Billing & Usage</h1>
            <p className="text-muted-foreground">
              Manage your credits, subscriptions, and monitor usage
              {user?.email && <span className="ml-2 text-muted-foreground">({user.email})</span>}
            </p>
          </div>
          <Button
            onClick={() => setActiveTab('add-credits')}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Credits
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Plan */}
          <Card className="bg-card border-border hover:border-foreground/20 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge className={
                  subscription?.plan === 'Pro'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-foreground'
                }>
                  {subscription?.plan || 'Free'}
                </Badge>
                {subscription?.nextBillingDate && (
                  <p className="text-xs text-muted-foreground">
                    Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                  </p>
                )}
                {subscription?.cancelAtPeriodEnd && (
                  <p className="text-xs text-yellow-400">Cancels at period end</p>
                )}
                <div className="flex gap-2">
                  {(!subscription || subscription.plan === 'Pay as you go') ? (
                    /* Straight to the card form at the catalog price — the same
                       checkout the plans page uses. No pricing↔billing ping-pong. */
                    <Subscribe slug="pro" />
                  ) : (
                    <Button
                      onClick={handleManageSubscription}
                      variant="outline"
                      className="w-full border-border text-foreground hover:bg-accent"
                      size="sm"
                    >
                      Manage Subscription
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credits */}
          <Card className="bg-card border-border hover:border-foreground/20 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Credit Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {/* The real per-org ledger, in the currency it is actually
                      denominated in (USD). Honest states: never a placeholder
                      number standing in for an unknown balance. */}
                  <span className="text-2xl font-medium">
                    {balancePhase === 'ready' && balanceCents !== null
                      ? `$${(balanceCents / 100).toFixed(2)}`
                      : balancePhase === 'loading' || balancePhase === 'idle'
                        ? '—'
                        : balancePhase === 'noauth'
                          ? 'Sign in'
                          : 'Unavailable'}
                  </span>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Spendable credit across every Hanzo service
                </p>
                <Button
                  onClick={() => setActiveTab('add-credits')}
                  variant="outline"
                  size="sm"
                  className="w-full border-border text-foreground hover:bg-accent"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Credit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Summary */}
          <Card className="bg-card border-border hover:border-foreground/20 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Calls</span>
                  <span>{(usage.api_calls?.used ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Responses</span>
                  <span>{(usage.ai_responses?.used ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage</span>
                  <span>{usage.storage?.used ?? 0} GB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-lg bg-card border border-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-accent">Overview</TabsTrigger>
            <TabsTrigger value="add-credits" className="data-[state=active]:bg-accent">Add Credits</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-accent">History</TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-accent">Usage</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CRYPTO_PAYMENTS_ENABLED && (
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => { setPaymentMethod('crypto'); setCreditModalOpen(true); }}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Pay with USDC
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent"
                  onClick={() => setActiveTab('add-credits')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay with Card
                </Button>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent"
                  onClick={() => router.push('/pricing')}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  View Plans
                </Button>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-accent"
                  onClick={() => setActiveTab('usage')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Usage Stats
                </Button>
              </CardContent>
            </Card>

            {/* Recent transactions in overview */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                {invoices.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setActiveTab('history')}
                  >
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-1">No transactions yet</p>
                    <p className="text-sm text-muted-foreground">Purchase credits to see your transaction history</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.slice(0, 3).map((invoice) => (
                      <TransactionRow key={invoice.id} invoice={invoice} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Credits Tab */}
          <TabsContent value="add-credits" className="mt-6 space-y-6">
            {/* Payment method toggle — only when crypto is live; otherwise card-only
                (paymentMethod stays 'card', so the USDC section + modal never show). */}
            {CRYPTO_PAYMENTS_ENABLED && (
            <div className="flex gap-2 p-1 bg-card border border-border rounded-lg w-fit">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  paymentMethod === 'card'
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CreditCard className="w-4 h-4 inline mr-2" />
                Credit Card
              </button>
              <button
                onClick={() => setPaymentMethod('crypto')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  paymentMethod === 'crypto'
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Wallet className="w-4 h-4 inline mr-2" />
                USDC
              </button>
            </div>
            )}

            {/* Card is the only live rail. The USDC grid that used to sit here
                was unreachable (CRYPTO_PAYMENTS_ENABLED is false, so the toggle
                never renders and paymentMethod never leaves 'card') and it
                advertised bonus credits no backend grants. */}
            <TopUp />
          </TabsContent>

          {/* History / Invoices Tab */}
          <TabsContent value="history" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All payments, invoices, and crypto transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-1">No transactions yet</p>
                    <p className="text-sm text-muted-foreground">Purchase credits to see your transaction history</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <TransactionRow key={invoice.id} invoice={invoice} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="mt-6 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Usage Details</CardTitle>
                <CardDescription>Current billing period usage across all services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* API Calls */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>API Calls</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {(usage.api_calls?.used ?? 0).toLocaleString()} / {(usage.api_calls?.limit ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={calculateUsagePercentage(usage.api_calls?.used ?? 0, usage.api_calls?.limit ?? 0)}
                    className="h-2 bg-accent"
                    indicatorClassName={getUsageColor(calculateUsagePercentage(usage.api_calls?.used ?? 0, usage.api_calls?.limit ?? 0))}
                  />
                </div>

                {/* AI Responses */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Brain className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>AI Responses</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {(usage.ai_responses?.used ?? 0).toLocaleString()} / {(usage.ai_responses?.limit ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={calculateUsagePercentage(usage.ai_responses?.used ?? 0, usage.ai_responses?.limit ?? 0)}
                    className="h-2 bg-accent"
                    indicatorClassName={getUsageColor(calculateUsagePercentage(usage.ai_responses?.used ?? 0, usage.ai_responses?.limit ?? 0))}
                  />
                </div>

                {/* Storage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Database className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>Storage</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {usage.storage?.used ?? 0} GB / {usage.storage?.limit ?? 0} GB
                    </span>
                  </div>
                  <Progress
                    value={calculateUsagePercentage(usage.storage?.used ?? 0, usage.storage?.limit ?? 0)}
                    className="h-2 bg-accent"
                    indicatorClassName={getUsageColor(calculateUsagePercentage(usage.storage?.used ?? 0, usage.storage?.limit ?? 0))}
                  />
                </div>

                {/* Credit consumption */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Credit Consumption</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <div className="text-lg font-medium">{usage.ai_responses?.used ?? 0}</div>
                      <div className="text-xs text-muted-foreground">AI credits used</div>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <div className="text-lg font-medium">
                        {balancePhase === 'ready' && balanceCents !== null
                          ? `$${(balanceCents / 100).toFixed(2)}`
                          : '--'}
                      </div>
                      <div className="text-xs text-muted-foreground">Credit remaining</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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
    </div>
    </AppShell>
  );
}

// Transaction row component
function TransactionRow({ invoice }: { invoice: Invoice }) {
  const statusIcon = invoice.status === 'paid' ? (
    <CheckCircle2 className="w-4 h-4 text-green-500" />
  ) : invoice.status === 'failed' ? (
    <XCircle className="w-4 h-4 text-red-500" />
  ) : (
    <Clock className="w-4 h-4 text-yellow-500" />
  );

  const explorerBaseUrl = invoice.chain === 'ethereum'
    ? 'https://etherscan.io'
    : invoice.chain === 'arbitrum'
    ? 'https://arbiscan.io'
    : 'https://basescan.org';

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        {statusIcon}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{invoice.description || 'Payment'}</p>
            <Badge variant="secondary" className="text-xs bg-accent">
              {invoice.type === 'crypto' ? 'USDC' : 'Card'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(invoice.date).toLocaleDateString()} -- ${invoice.amount.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {invoice.type === 'crypto' && invoice.txHash && (
          <a
            href={`${explorerBaseUrl}/tx/${invoice.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {invoice.type === 'card' && (invoice.pdfUrl || invoice.hostedUrl) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(invoice.pdfUrl || invoice.hostedUrl, '_blank')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
