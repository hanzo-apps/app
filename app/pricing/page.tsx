"use client";

import Link from "next/link";
import { Button } from "@hanzo/ui";
import { HanzoLogo } from "@/components/HanzoLogo";
import { Badge } from "@hanzo/ui";
import { Check, Sparkles, Zap, CreditCard, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const router = useRouter();

  const handleCheckout = async (planId: string) => {
    // TODO: Implement Stripe checkout
    router.push(`/api/stripe/checkout?plan=${planId}&billing=${billingCycle}`);
  };

  const plans = [
    {
      name: "Pay as you go",
      description: "Start building immediately, pay only for what you use",
      price: {
        monthly: "Usage-based",
        yearly: "Usage-based"
      },
      features: [
        { text: "$0.02 per AI response", included: true },
        { text: "$0.50 per 1,000 API calls", included: true },
        { text: "$0.10 per GB storage", included: true },
        { text: "No monthly commitment", included: true },
        { text: "All core features", included: true },
        { text: "Community support", included: true },
        { text: "Public & private projects", included: true },
        { text: "Pay only what you use", included: true },
      ],
      cta: "Start Building",
      highlighted: false,
      icon: <CreditCard className="w-5 h-5" />,
      planId: "pay-as-you-go"
    },
    {
      name: "Pro",
      description: "Everything you need to build and ship professional apps",
      price: {
        monthly: 20,
        yearly: 200  // $200/year = ~$16.67/month, saves $40
      },
      features: [
        { text: "Everything in pay-as-you-go", included: true },
        { text: "10,000 AI responses/month included", included: true },
        { text: "100,000 API calls/month included", included: true },
        { text: "50GB storage included", included: true },
        { text: "Priority support", included: true },
        { text: "Custom domains", included: true },
        { text: "Advanced AI models", included: true },
        { text: "Team collaboration", included: true },
        { text: "Analytics dashboard", included: true },
        { text: "No usage limits", included: true },
      ],
      cta: "Start Free Trial",
      highlighted: true,
      icon: <Zap className="w-5 h-5" />,
      badge: "Most Popular",
      planId: "pro"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <HanzoLogo className="w-8 h-8 text-white" />
              <span className="text-xl font-bold">Hanzo</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/community" className="text-white/70 hover:text-white">Community</Link>
              <Link href="/pricing" className="text-white font-medium">Pricing</Link>
              <Link href="/enterprise" className="text-white/70 hover:text-white">Enterprise</Link>
              <Link href="/learn" className="text-white/70 hover:text-white">Learn</Link>
            </div>
          </div>
          <Button className="bg-white text-black hover:bg-white/90">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 md:px-8 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-gradient-to-r from-[#fd4444] to-[#e03e3e] text-white border-0">
            <Sparkles className="w-4 h-4 mr-2" />
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Choose the plan that{" "}
            <span className="bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] bg-clip-text text-transparent">
              fits your needs
            </span>
          </h1>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingCycle === "yearly"
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Yearly
              <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">
                Save $40
              </Badge>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 md:px-8 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border ${
                  plan.highlighted
                    ? "border-[#fd4444]/50 bg-gradient-to-b from-[#fd4444]/20 to-transparent"
                    : "border-white/10 bg-[#1a1a1a]"
                } p-8`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] text-white border-0">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    plan.highlighted ? "bg-[#fd4444]/20" : "bg-white/10"
                  }`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                </div>

                <p className="text-white/60 mb-6">{plan.description}</p>

                <div className="mb-8">
                  {typeof plan.price[billingCycle] === "number" ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        ${plan.price[billingCycle]}
                      </span>
                      <span className="text-white/60">
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold">{plan.price[billingCycle]}</div>
                  )}
                </div>

                <Button
                  onClick={() => handleCheckout(plan.planId)}
                  className={`w-full mb-8 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] hover:from-[#ff6b6b] hover:to-[#fd4444]"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                  size="lg"
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <div className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-white">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 md:px-8 py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold mb-3">Can I change plans anytime?</h3>
              <p className="text-white/60">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges or credits.
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold mb-3">What payment methods do you accept?</h3>
              <p className="text-white/60">
                We accept all major credit cards (Visa, MasterCard, American Express), as well as PayPal and wire transfers for enterprise customers.
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold mb-3">Is there a free trial for Pro plans?</h3>
              <p className="text-white/60">
                Yes! All Pro plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold mb-3">What happens if I exceed my limits?</h3>
              <p className="text-white/60">
                We'll notify you when you're approaching your limits. You can upgrade your plan anytime to get more resources.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to build something amazing?
          </h2>
          <p className="text-xl text-white/60 mb-8">
            Join thousands of developers using Hanzo AI to build faster
          </p>
          <Button size="lg" className="bg-white text-black hover:bg-white/90">
            Start Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-[#0a0a0a] border-t border-white/10 mt-16 md:mt-32">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          {/* Top Footer Section - responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8 mb-8 md:mb-12">
            {/* Product Column */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Product</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/features" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Features</Link></li>
                <li><Link href="/integrations" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Integrations</Link></li>
                <li><Link href="/pricing" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Pricing</Link></li>
                <li><Link href="/changelog" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Changelog</Link></li>
                <li><Link href="/roadmap" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Roadmap</Link></li>
              </ul>
            </div>

            {/* Solutions Column */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Solutions</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/startups" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">For Startups</Link></li>
                <li><Link href="/enterprise" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">For Enterprise</Link></li>
                <li><Link href="/agencies" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">For Agencies</Link></li>
                <li><Link href="/developers" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">For Developers</Link></li>
                <li><Link href="/designers" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">For Designers</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Resources</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/docs" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Documentation</Link></li>
                <li><Link href="/tutorials" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Tutorials</Link></li>
                <li><Link href="/blog" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Blog</Link></li>
                <li><Link href="/community" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Community</Link></li>
                <li><Link href="/templates" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Templates</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Company</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/about" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">About</Link></li>
                <li><Link href="/careers" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Careers</Link></li>
                <li><Link href="/press" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Press</Link></li>
                <li><Link href="/partners" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Partners</Link></li>
                <li><Link href="/contact" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Support</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/help" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Help Center</Link></li>
                <li><Link href="/status" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Status</Link></li>
                <li><Link href="/security" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Security</Link></li>
                <li><Link href="/api" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">API</Link></li>
                <li><Link href="/report" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Report Issue</Link></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-3 md:mb-4">Legal</h3>
              <ul className="space-y-2 md:space-y-3">
                <li><Link href="/privacy" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Terms</Link></li>
                <li><Link href="/cookies" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Cookies</Link></li>
                <li><Link href="/licenses" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Licenses</Link></li>
                <li><Link href="/compliance" className="text-white/60 hover:text-white text-xs md:text-sm transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer - responsive */}
          <div className="pt-6 md:pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
              {/* Logo and Copyright */}
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
                <div className="flex items-center gap-3">
                  <HanzoLogo className="w-6 md:w-7 h-6 md:h-7 text-white" />
                  <span className="text-base md:text-lg font-bold">Hanzo</span>
                </div>
                <span className="text-xs md:text-sm text-white/40">
                  © 2025 Hanzo AI, Inc. All rights reserved.
                </span>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4 md:gap-5">
                <Link href="https://twitter.com/hanzoai" className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </Link>
                <Link href="https://github.com/hanzoai" className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.607.069-.607 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd"/>
                  </svg>
                </Link>
                <Link href="https://discord.gg/hanzoai" className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.369a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </Link>
                <Link href="https://linkedin.com/company/hanzoai" className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </Link>
                <Link href="https://youtube.com/@hanzoai" className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}