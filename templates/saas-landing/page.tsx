"use client";

import { YStack, SizableText, H1, Paragraph, XStack, H2 } from '@hanzo/gui';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Badge, Input } from '@hanzo/ui';
import { CheckCircle, ArrowRight, Zap, Shield, Globe } from "lucide-react";

const features = [
  {
    icon: <Zap size={24} />,
    title: "Lightning Fast",
    description: "Built with performance in mind using @hanzo/ui components"
  },
  {
    icon: <Shield size={24} />,
    title: "Secure by Default",
    description: "Enterprise-grade security with end-to-end encryption"
  },
  {
    icon: <Globe size={24} />,
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
    <YStack minHeight="100%">
      {/* Hero Section */}
      <YStack position="relative" overflow="hidden">
        <YStack position="absolute" top={0} right={0} bottom={0} left={0} opacity={0.05} className="bg-grid-pattern" />
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$12" position="relative">
          <SizableText textAlign="center" maxWidth={896} alignSelf="center" display="flex" flexDirection="column">
            <Badge className="mb-4" variant="outline">
              Built with @hanzo/ui
            </Badge>
            <H1 fontSize="$12" fontWeight="700" marginBottom="$5" backgroundClip="text" color="transparent" $md={{ fontSize: "$13" }}>
              Build Better Products Faster
            </H1>
            <Paragraph fontSize="$7" color="$color11" marginBottom="$6">
              The modern SaaS platform powered by @hanzo/ui components.
              Ship features faster with our comprehensive UI system.
            </Paragraph>
            <YStack gap="$4" justifyContent="center" $sm={{ flexDirection: "row" }}>
              <Button size="lg" gap="$2">
                Get Started Free
                <ArrowRight size={16} />
              </Button>
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </YStack>

            {/* Trust Badges */}
            <XStack marginTop="$8" alignItems="center" justifyContent="center" gap="$6" opacity={0.6}>
              <Paragraph fontSize="$3">Trusted by</Paragraph>
              <XStack gap="$6">
                {["Company A", "Company B", "Company C"].map((company) => (
                  <SizableText key={company} fontSize="$3" fontWeight="500" display="flex" flexDirection="column">
                    {company}
                  </SizableText>
                ))}
              </XStack>
            </XStack>
          </SizableText>
        </YStack>
      </YStack>

      {/* Features Section */}
      <YStack paddingVertical="$12" backgroundColor="$color3">
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5">
          <SizableText textAlign="center" marginBottom="$8" display="flex" flexDirection="column">
            <H2 fontSize="$10" fontWeight="700" marginBottom="$4">Why Choose Our Platform</H2>
            <Paragraph color="$color11">Everything you need to succeed</Paragraph>
          </SizableText>
          <YStack gap="$6">
            {features.map((feature, i) => (
              <Card key={i} borderWidth={2} hoverStyle={{ borderColor: "$green9" }}>
                <CardHeader>
                  <SizableText width="$8" height="$8" borderRadius="$5" backgroundColor="$green9" alignItems="center" justifyContent="center" color="$green10" marginBottom="$4" display="flex" flexDirection="row">
                    {feature.icon}
                  </SizableText>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </YStack>
        </YStack>
      </YStack>

      {/* Pricing Section */}
      <YStack paddingVertical="$12">
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5">
          <SizableText textAlign="center" marginBottom="$8" display="flex" flexDirection="column">
            <H2 fontSize="$10" fontWeight="700" marginBottom="$4">Simple, Transparent Pricing</H2>
            <Paragraph color="$color11">Choose the plan that fits your needs</Paragraph>
          </SizableText>
          <YStack gap="$6" maxWidth={1024} alignSelf="center">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                {...{ borderColor: plan.popular ? "$green9" : undefined, elevation: plan.popular ? 4 : undefined, scale: plan.popular ? 1.05 : undefined }}
              >
                <CardHeader>
                  {plan.popular && (
                    <Badge className="w-fit mb-2">Most Popular</Badge>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <YStack marginTop="$4">
                    <SizableText fontSize="$11" fontWeight="700">{plan.price}</SizableText>
                    {plan.price !== "Custom" && <SizableText color="$color11">/month</SizableText>}
                  </YStack>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <YStack rowGap="$2">
                    {plan.features.map((feature) => (
                      <XStack key={feature} alignItems="center" gap="$2">
                        <CheckCircle size={16} />
                        <SizableText fontSize="$3">{feature}</SizableText>
                      </XStack>
                    ))}
                  </YStack>
                </CardContent>
                <CardFooter>
                  <Button width="100%" variant={plan.popular ? "default" : "outline"}>
                    {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </YStack>
        </YStack>
      </YStack>

      {/* CTA Section */}
      <SizableText paddingVertical="$12" color="white" display="flex" flexDirection="column">
        <SizableText width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" textAlign="center" display="flex" flexDirection="column">
          <H2 fontSize="$10" fontWeight="700" marginBottom="$4">Ready to Get Started?</H2>
          <Paragraph marginBottom="$6" opacity={0.9}>
            Join thousands of teams already using our platform
          </Paragraph>
          <XStack maxWidth={448} alignSelf="center" gap="$2">
            <Input
              placeholder="Enter your email"
              backgroundColor="$background" borderColor="$background" color="$background" placeholderTextColor="$background"
  />
            <Button variant="secondary">
              Get Started
            </Button>
          </XStack>
        </SizableText>
      </SizableText>
    </YStack>
  );
}