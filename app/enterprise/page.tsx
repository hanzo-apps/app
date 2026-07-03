"use client";

import Link from "next/link";
import { Button } from "@hanzo/ui";
import { HanzoLogo } from "@/components/HanzoLogo";
import { Badge } from "@hanzo/ui";
import { Shield, Lock, Users, Zap, Globe, HeadphonesIcon, ArrowRight, CheckCircle2, Building } from "lucide-react";

export default function EnterprisePage() {
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Enterprise Security",
      description: "SOC 2 Type II certified with end-to-end encryption, SAML SSO, and advanced access controls"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Unlimited Team Members",
      description: "Scale your team without limits. Advanced role management and permissions"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Dedicated Infrastructure",
      description: "Isolated compute resources with guaranteed performance and 99.99% SLA"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Deployment",
      description: "Deploy to multiple regions with automatic failover and edge optimization"
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Private AI Models",
      description: "Train and deploy custom models on your data with complete privacy"
    },
    {
      icon: <HeadphonesIcon className="w-6 h-6" />,
      title: "24/7 Priority Support",
      description: "Dedicated support team with <1 hour response time and technical account manager"
    }
  ];

  const companies = [
    "Microsoft", "Google", "Amazon", "Meta", "Apple", "Netflix", "Spotify", "Uber"
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
              <Link href="/pricing" className="text-white/70 hover:text-white">Pricing</Link>
              <Link href="/enterprise" className="text-white font-medium">Enterprise</Link>
              <Link href="/learn" className="text-white/70 hover:text-white">Learn</Link>
            </div>
          </div>
          <Button className="bg-white text-black hover:bg-white/90">
            Contact Sales
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 md:px-8 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0">
            <Building className="w-4 h-4 mr-2" />
            Enterprise Ready
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            AI Development at
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              {" "}Enterprise Scale
            </span>
          </h1>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Trusted by Fortune 500 companies to build, deploy, and scale AI applications with confidence
          </p>
          <div className="flex items-center gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400">
              Schedule Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Download Whitepaper
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="px-4 md:px-8 py-12 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-white/60 mb-8">Trusted by leading companies worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {companies.map(company => (
              <div key={company} className="text-white/40 text-lg font-medium hover:text-white/60 transition-colors">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 md:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for enterprise AI
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Built from the ground up with enterprise requirements in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(feature => (
              <div key={feature.title} className="bg-[#1a1a1a] rounded-2xl p-8 border border-white/10 hover:border-violet-500/50 transition-all">
                <div className="p-3 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl inline-block mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="px-4 md:px-8 py-20 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30">
                Security First
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Bank-grade security & compliance
              </h2>
              <p className="text-lg text-white/60 mb-8">
                We take security seriously so you can focus on building amazing products
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-1">SOC 2 Type II Certified</div>
                    <div className="text-sm text-white/60">Annual audits ensure the highest security standards</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-1">GDPR & CCPA Compliant</div>
                    <div className="text-sm text-white/60">Full compliance with global data privacy regulations</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-1">ISO 27001 Certified</div>
                    <div className="text-sm text-white/60">International standard for information security</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-1">End-to-end Encryption</div>
                    <div className="text-sm text-white/60">Your data is encrypted at rest and in transit</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold mb-6">Get a custom quote</h3>
              <p className="text-white/60 mb-8">
                Tell us about your needs and we'll create a custom plan for your organization
              </p>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Company Name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                />
                <input
                  type="email"
                  placeholder="Work Email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                />
                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 focus:outline-none focus:border-violet-500/50">
                  <option>Company Size</option>
                  <option>10-50 employees</option>
                  <option>50-200 employees</option>
                  <option>200-1000 employees</option>
                  <option>1000+ employees</option>
                </select>
                <textarea
                  placeholder="Tell us about your project"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                />
                <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400">
                  Contact Sales Team
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to transform your business with AI?
          </h2>
          <p className="text-xl text-white/60 mb-8">
            Join leading companies using Hanzo to build the future
          </p>
          <Button size="lg" className="bg-white text-black hover:bg-white/90">
            Schedule Enterprise Demo
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}