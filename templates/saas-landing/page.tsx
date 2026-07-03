"use client";

import { Button } from "@hanzo/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { CheckCircle, ArrowRight, Star, Zap, Shield, Globe } from "lucide-react";

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Lightning Fast",
    description: "Built with performance in mind using @hanzo/ui components"
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure by Default",
    description: "Enterprise-grade security with end-to-end encryption"
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Global Scale",
    description: "Deploy worldwide with edge computing capabilities"
  }
];

const pricing = [
  {
    name: "Starter",
    price: "$9",
    description: "Perfect for small projects",
    features: ["5 Projects", "1GB Storage", "Community Support", "Basic Analytics"],
    popular: false
  },
  {
    name: "Pro",
    price: "$29",
    description: "For growing businesses",
    features: ["Unlimited Projects", "100GB Storage", "Priority Support", "Advanced Analytics", "Custom Domain", "API Access"],
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: ["Everything in Pro", "Unlimited Storage", "24/7 Support", "SLA", "SSO", "Audit Logs"],
    popular: false
  }
];

export default function SaaSLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-6 py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4" variant="outline">
              Built with @hanzo/ui
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Build Better Products Faster
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              The modern SaaS platform powered by @hanzo/ui components.
              Ship features faster with our comprehensive UI system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex items-center justify-center gap-8 opacity-60">
              <p className="text-sm">Trusted by</p>
              <div className="flex gap-8">
                {["Company A", "Company B", "Company C"].map((company) => (
                  <div key={company} className="text-sm font-medium">
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Platform</h2>
            <p className="text-muted-foreground">Everything you need to succeed</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Card key={i} className="border-2 hover:border-emerald-500 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Choose the plan that fits your needs</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={plan.popular ? "border-emerald-500 shadow-lg scale-105" : ""}
              >
                <CardHeader>
                  {plan.popular && (
                    <Badge className="w-fit mb-2">Most Popular</Badge>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="mb-8 opacity-90">
            Join thousands of teams already using our platform
          </p>
          <div className="max-w-md mx-auto flex gap-2">
            <Input
              placeholder="Enter your email"
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
            />
            <Button variant="secondary">
              Get Started
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}