"use client";

import { Button } from "@hanzo/ui-shadcn";
import { Badge } from "@hanzo/ui-shadcn";
import { Input, Textarea } from "@/components/control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/overlay";
import { Shield, Lock, Users, Zap, Globe, HeadphonesIcon, ArrowRight, CheckCircle2, Building } from "lucide-react";
import Header from "@/components/layout/header";
import LogoWall from "@/components/landing/logo-wall";
import SiteFooter from "@/components/landing/site-footer";

export default function EnterprisePage() {
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Enterprise Security",
      description: "End-to-end encryption, SAML SSO, and advanced access controls. SOC 2 Type II audit in progress."
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="px-4 md:px-8 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-primary text-primary-foreground border-0">
            <Building className="w-4 h-4 mr-2" />
            Enterprise Ready
          </Badge>
          <h1 className="text-4xl md:text-6xl font-medium mb-6 text-balance">
            AI Development at
            <span className="text-foreground">
              {" "}Enterprise Scale
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Build, deploy, and scale AI applications with enterprise-grade security, compliance, and dedicated support
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
              Schedule Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-border text-foreground hover:bg-accent">
              Download Whitepaper
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section — real Techstars '17 + infra-partner proof (shared with landing) */}
      <LogoWall />

      {/* Features Grid */}
      <section className="px-4 md:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium mb-4">
              Everything you need for enterprise AI
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built from the ground up with enterprise requirements in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(feature => (
              <div key={feature.title} className="bg-muted rounded-2xl p-8 border border-border hover:border-violet-500/50 transition-all">
                <div className="p-3 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl inline-block mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
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
              <h2 className="text-3xl md:text-4xl font-medium mb-6">
                Bank-grade security & compliance
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We take security seriously so you can focus on building amazing products
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">SOC 2 Type II — Audit in Progress</div>
                    <div className="text-sm text-muted-foreground">Independent Type II audit underway; report available under NDA on completion</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">GDPR & CCPA Compliant</div>
                    <div className="text-sm text-muted-foreground">Full compliance with global data privacy regulations</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">SSO, RBAC & Audit Logs</div>
                    <div className="text-sm text-muted-foreground">SAML single sign-on, role-based access control, and a full audit trail</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">End-to-end Encryption</div>
                    <div className="text-sm text-muted-foreground">Your data is encrypted at rest and in transit</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-muted rounded-2xl p-8 border border-border">
              <h3 className="text-2xl font-medium mb-6">Get a custom quote</h3>
              <p className="text-muted-foreground mb-8">
                Tell us about your needs and we'll create a custom plan for your organization
              </p>
              {/* This form used to run its own control spec, and got five controls
                  onto four of them: two 49px hand-rolled inputs, a 46px NATIVE
                  <select> painting a raw OS chevron and OS menu beside Radix-quality
                  siblings, a 118px textarea, and a 30px submit. Its only focus cue
                  was `focus:border-violet-500/50`, which the monochrome sweep
                  neutralises to a grey barely distinct from the resting border. All
                  five are now the ONE control. */}
              <form className="space-y-4">
                <Input type="text" placeholder="Company Name" />
                <Input type="email" placeholder="Work Email" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Company Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10-50">10-50 employees</SelectItem>
                    <SelectItem value="50-200">50-200 employees</SelectItem>
                    <SelectItem value="200-1000">200-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Tell us about your project" rows={4} />
                {/* The fill is the variant's to choose, not this call site's. It
                    used to hand-paint a violet->purple gradient; the monochrome
                    sweep neutralises those decorative hues to a mid grey, but the
                    Button kept the near-black foreground that was picked for its
                    WHITE default fill — leaving the page's primary CTA at 1.10:1.
                    Its sibling, which never hand-painted, measures 19.80:1. */}
                <Button className="w-full">Contact Sales Team</Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium mb-6">
            Ready to transform your business with AI?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join leading companies using Hanzo to build the future
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Schedule Enterprise Demo
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}