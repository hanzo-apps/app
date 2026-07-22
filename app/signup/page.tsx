'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useIam } from '@hanzo/iam/react';
import { EVENTS } from '@hanzo/event';
import { useAnalytics } from '@hanzo/event/react';
import { HanzoLogo } from '@/components/HanzoLogo';
import { Button } from '@hanzo/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@hanzo/ui';
import { Badge } from '@hanzo/ui';
import { Loader2, Sparkles, Zap, Shield, Rocket } from 'lucide-react';

/**
 * /signup — HIP-0111 canonical. There is no local credential form: Hanzo IAM
 * owns every credential interaction. "Sign up with Hanzo" starts the same
 * @hanzo/iam OAuth2 PKCE flow as /login (IAM presents register on its
 * authorize page). Monochrome, on-brand — no red, no off-brand gradients.
 */
export default function SignupPage() {
  const { login } = useIam();
  const analytics = useAnalytics();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    analytics.capture(EVENTS.SIGNUP_VIEWED);
  }, [analytics]);

  const handleSignup = () => {
    analytics.capture(EVENTS.SIGNUP_SUBMITTED);
    setLoading(true);
    login();
  };

  return (
    <div className="min-h-screen bg-card text-foreground flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <HanzoLogo className="w-8 h-8 text-foreground" />
            <span className="text-xl font-medium">Hanzo</span>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="border-border text-foreground hover:bg-accent">
              Sign in
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <Card className="bg-card border-border">
            <CardHeader className="space-y-1 text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-muted border border-border rounded-2xl flex items-center justify-center relative">
                  <HanzoLogo className="w-10 h-10 text-foreground" />
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground border-0">
                    Free
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription className="text-muted-foreground">
                Start building with Hanzo AI today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* What you get section */}
              <div className="space-y-3 p-4 bg-muted rounded-lg border border-border">
                <h3 className="text-sm font-medium text-foreground mb-3">What you'll get:</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-foreground" />
                    <span className="text-sm text-foreground">Access to 400+ AI models</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-foreground" />
                    <span className="text-sm text-foreground">$5 free cloud credits to start</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-foreground" />
                    <span className="text-sm text-foreground">Secure cloud infrastructure</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Rocket className="w-4 h-4 text-foreground" />
                    <span className="text-sm text-foreground">Deploy instantly to production</span>
                  </div>
                </div>
              </div>

              {/* Signup Button — Hanzo IAM, the only way */}
              <Button
                onClick={handleSignup}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-12"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Rocket className="w-5 h-5 mr-2" />
                    Sign up with Hanzo
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">
                    No credit card required
                  </span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">GDPR Ready</span>
                </div>
              </div>

              {/* Footer Links */}
              <div className="pt-4 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-foreground hover:text-foreground/70 underline">
                    Sign in
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  By signing up, you agree to our{' '}
                  <Link href="/terms" className="underline hover:text-foreground">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
