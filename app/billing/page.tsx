'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/header';
import { CryptoPayment } from '@/components/crypto-payment';

// UI Components
import { Button } from "@hanzo/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@hanzo/ui";
import { Progress } from "@hanzo/ui";

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
  type: 'stripe' | 'crypto';
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

// Credit tier options for Stripe checkout
const STRIPE_CREDIT_TIERS = [
  { amount: 10, credits: 1000, label: 'Starter' },
  { amount: 25, credits: 2750, label: 'Popular', popular: true },
  { amount: 50, credits: 6000, label: 'Pro' },
  { amount: 100, credits: 13000, label: 'Enterprise' },
];

export default function BillingPage() {
  const { user, authenticated, loading: authLoading } = useAuth({ redirectTo: '/login' });
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'crypto'>('stripe');
  const [stripeLoading, setStripeLoading] = useState<number | null>(null);

  // Billing data
  const [credits, setCredits] = useState(0);
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
        if (usageData.usage) {
          setUsage(usageData.usage);
        }
      }

      // Fetch subscription status
      const subResponse = await fetch('/api/stripe/subscription');
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

      // Fetch invoices from Stripe
      const invoiceResponse = await fetch('/api/stripe/invoices');
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json();
        if (invoiceData.invoices) {
          setInvoices(invoiceData.invoices.map((inv: any) => ({
            ...inv,
            type: 'stripe' as const,
          })));
        }
      }

      // Fetch credits
      const creditsResponse = await fetch('/api/stripe/credits');
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        setCredits(creditsData.credits || 0);
      }
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
    setCredits(prev => prev + creditsAdded);
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

  const handleStripeCheckout = async (amount: number, credits: number) => {
    setStripeLoading(amount);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          credits,
          type: 'credits',
          successUrl: `${window.location.origin}/billing?success=true&credits=${credits}`,
          cancelUrl: `${window.location.origin}/billing?canceled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
    } finally {
      setStripeLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/billing`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Portal error:', error);
    }
  };

  // Handle Stripe success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const addedCredits = parseInt(params.get('credits') || '0', 10);
      if (addedCredits > 0) {
        setCredits(prev => prev + addedCredits);
      }
      // Clean URL
      window.history.replaceState({}, '', '/billing');
    }
  }, []);

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
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Billing & Usage</h1>
            <p className="text-white/60">
              Manage your credits, subscriptions, and monitor usage
              {user?.email && <span className="ml-2 text-white/40">({user.email})</span>}
            </p>
          </div>
          <Button
            onClick={() => setActiveTab('add-credits')}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Credits
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Plan */}
          <Card className="bg-[#1a1a1a] border-white/10 hover:border-white/20 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge className={
                  subscription?.plan === 'Pro'
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                    : 'bg-white/10 text-white/70'
                }>
                  {subscription?.plan || 'Free'}
                </Badge>
                {subscription?.nextBillingDate && (
                  <p className="text-xs text-white/60">
                    Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                  </p>
                )}
                {subscription?.cancelAtPeriodEnd && (
                  <p className="text-xs text-yellow-400">Cancels at period end</p>
                )}
                <div className="flex gap-2">
                  {(!subscription || subscription.plan === 'Pay as you go') ? (
                    <Button
                      onClick={() => router.push('/pricing')}
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                      size="sm"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  ) : (
                    <Button
                      onClick={handleManageSubscription}
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
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
          <Card className="bg-[#1a1a1a] border-white/10 hover:border-white/20 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Credits Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{credits.toLocaleString()}</span>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-xs text-white/40">
                  1 credit = 1 AI response
                </p>
                <Button
                  onClick={() => setActiveTab('add-credits')}
                  variant="outline"
                  size="sm"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Credits
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Summary */}
          <Card className="bg-[#1a1a1a] border-white/10 hover:border-white/20 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">API Calls</span>
                  <span>{usage.api_calls.used.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">AI Responses</span>
                  <span>{usage.ai_responses.used.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Storage</span>
                  <span>{usage.storage.used} GB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-lg bg-[#1a1a1a] border border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/10">Overview</TabsTrigger>
            <TabsTrigger value="add-credits" className="data-[state=active]:bg-white/10">Add Credits</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white/10">History</TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-white/10">Usage</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card className="bg-[#1a1a1a] border-white/10">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                  onClick={() => { setPaymentMethod('crypto'); setCreditModalOpen(true); }}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Pay with USDC
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => setActiveTab('add-credits')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay with Card
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => router.push('/pricing')}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  View Plans
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => setActiveTab('usage')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Usage Stats
                </Button>
              </CardContent>
            </Card>

            {/* Recent transactions in overview */}
            {invoices.length > 0 && (
              <Card className="bg-[#1a1a1a] border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Transactions</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white"
                    onClick={() => setActiveTab('history')}
                  >
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invoices.slice(0, 3).map((invoice) => (
                      <TransactionRow key={invoice.id} invoice={invoice} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Add Credits Tab */}
          <TabsContent value="add-credits" className="mt-6 space-y-6">
            {/* Payment method toggle */}
            <div className="flex gap-2 p-1 bg-[#1a1a1a] border border-white/10 rounded-lg w-fit">
              <button
                onClick={() => setPaymentMethod('stripe')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  paymentMethod === 'stripe'
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4 inline mr-2" />
                Credit Card
              </button>
              <button
                onClick={() => setPaymentMethod('crypto')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  paymentMethod === 'crypto'
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Wallet className="w-4 h-4 inline mr-2" />
                USDC
              </button>
            </div>

            {paymentMethod === 'stripe' ? (
              <Card className="bg-[#1a1a1a] border-white/10">
                <CardHeader>
                  <CardTitle>Purchase Credits with Card</CardTitle>
                  <CardDescription>Powered by Stripe. All major cards accepted.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {STRIPE_CREDIT_TIERS.map((tier) => (
                      <div
                        key={tier.amount}
                        className={`relative p-5 rounded-xl border transition-all ${
                          tier.popular
                            ? 'border-violet-500/50 bg-violet-500/5'
                            : 'border-white/10 hover:border-white/30 bg-[#0a0a0a]'
                        }`}
                      >
                        {tier.popular && (
                          <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs">
                            Most Popular
                          </Badge>
                        )}
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold">${tier.amount}</div>
                          <div className="text-sm text-white/60 mt-1">{tier.label}</div>
                        </div>
                        <div className="flex items-center justify-center text-sm text-white/80 mb-4">
                          <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                          {tier.credits.toLocaleString()} credits
                        </div>
                        <Button
                          onClick={() => handleStripeCheckout(tier.amount, tier.credits)}
                          disabled={stripeLoading !== null}
                          className={`w-full ${
                            tier.popular
                              ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                          size="sm"
                        >
                          {stripeLoading === tier.amount ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Buy
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#1a1a1a] border-white/10">
                <CardHeader>
                  <CardTitle>Purchase Credits with USDC</CardTitle>
                  <CardDescription>Pay with USDC on Base, Ethereum, or Arbitrum.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {STRIPE_CREDIT_TIERS.map((tier) => (
                      <div
                        key={tier.amount}
                        className={`relative p-5 rounded-xl border transition-all ${
                          tier.popular
                            ? 'border-violet-500/50 bg-violet-500/5'
                            : 'border-white/10 hover:border-white/30 bg-[#0a0a0a]'
                        }`}
                      >
                        {tier.popular && (
                          <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs">
                            Most Popular
                          </Badge>
                        )}
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold">${tier.amount}</div>
                          <div className="text-sm text-white/60 mt-1">USDC</div>
                        </div>
                        <div className="flex items-center justify-center text-sm text-white/80 mb-4">
                          <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                          {tier.credits.toLocaleString()} credits
                        </div>
                        <Button
                          onClick={() => setCreditModalOpen(true)}
                          className={`w-full ${
                            tier.popular
                              ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                          size="sm"
                        >
                          <Wallet className="w-4 h-4 mr-2" />
                          Buy
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/40 mt-4 text-center">
                    Treasury: 0xda93...f5c -- USDC on Base, Ethereum Mainnet, and Arbitrum
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History / Invoices Tab */}
          <TabsContent value="history" className="mt-6">
            <Card className="bg-[#1a1a1a] border-white/10">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All payments, invoices, and crypto transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-white/20 mb-3" />
                    <p className="text-white/60 mb-1">No transactions yet</p>
                    <p className="text-sm text-white/40">Purchase credits to see your transaction history</p>
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
            <Card className="bg-[#1a1a1a] border-white/10">
              <CardHeader>
                <CardTitle>Usage Details</CardTitle>
                <CardDescription>Current billing period usage across all services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* API Calls */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-white/60" />
                      <span>API Calls</span>
                    </div>
                    <span className="text-sm text-white/60">
                      {usage.api_calls.used.toLocaleString()} / {usage.api_calls.limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={calculateUsagePercentage(usage.api_calls.used, usage.api_calls.limit)}
                    className="h-2 bg-white/10"
                    indicatorClassName={getUsageColor(calculateUsagePercentage(usage.api_calls.used, usage.api_calls.limit))}
                  />
                </div>

                {/* AI Responses */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Brain className="w-4 h-4 mr-2 text-white/60" />
                      <span>AI Responses</span>
                    </div>
                    <span className="text-sm text-white/60">
                      {usage.ai_responses.used.toLocaleString()} / {usage.ai_responses.limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={calculateUsagePercentage(usage.ai_responses.used, usage.ai_responses.limit)}
                    className="h-2 bg-white/10"
                    indicatorClassName={getUsageColor(calculateUsagePercentage(usage.ai_responses.used, usage.ai_responses.limit))}
                  />
                </div>

                {/* Storage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Database className="w-4 h-4 mr-2 text-white/60" />
                      <span>Storage</span>
                    </div>
                    <span className="text-sm text-white/60">
                      {usage.storage.used} GB / {usage.storage.limit} GB
                    </span>
                  </div>
                  <Progress
                    value={calculateUsagePercentage(usage.storage.used, usage.storage.limit)}
                    className="h-2 bg-white/10"
                    indicatorClassName={getUsageColor(calculateUsagePercentage(usage.storage.used, usage.storage.limit))}
                  />
                </div>

                {/* Credit consumption */}
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-sm font-medium text-white/60 mb-3">Credit Consumption</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-[#0a0a0a] border border-white/10">
                      <div className="text-lg font-bold">{usage.ai_responses.used}</div>
                      <div className="text-xs text-white/60">AI credits used</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0a0a0a] border border-white/10">
                      <div className="text-lg font-bold">{credits.toLocaleString()}</div>
                      <div className="text-xs text-white/60">Credits remaining</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0a0a0a] border border-white/10">
                      <div className="text-lg font-bold">
                        {credits > 0 && usage.ai_responses.used > 0
                          ? Math.ceil(credits / (usage.ai_responses.used / 30))
                          : '--'}
                      </div>
                      <div className="text-xs text-white/60">Est. days left</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Crypto Payment Modal */}
      <CryptoPayment
        open={creditModalOpen && paymentMethod === 'crypto'}
        onOpenChange={(open) => {
          setCreditModalOpen(open);
          if (!open) setPaymentMethod('stripe');
        }}
        onSuccess={handleCryptoPaymentSuccess}
      />
    </div>
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
    <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3">
        {statusIcon}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{invoice.description || 'Payment'}</p>
            <Badge variant="secondary" className="text-xs bg-white/10">
              {invoice.type === 'crypto' ? 'USDC' : 'Card'}
            </Badge>
          </div>
          <p className="text-sm text-white/60">
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
            className="text-white/40 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {invoice.type === 'stripe' && (invoice.pdfUrl || invoice.hostedUrl) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(invoice.pdfUrl || invoice.hostedUrl, '_blank')}
            className="text-white/60 hover:text-white"
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
