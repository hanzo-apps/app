'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HanzoLogo } from '@/components/HanzoLogo';
import { Button } from "@hanzo/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { getAuth } from '@/app/actions/auth';
import { Loader2, Sparkles, Zap, Shield, Rocket } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    try {
      const authUrl = await getAuth();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Signup error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <HanzoLogo className="w-8 h-8 text-white" />
            <span className="text-xl font-bold">Hanzo</span>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Sign in
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardHeader className="space-y-1 text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#fd4444] to-[#ff6b6b] rounded-2xl flex items-center justify-center relative">
                  <HanzoLogo className="w-10 h-10 text-white" />
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                    Free
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription className="text-white/60">
                Start building with Hanzo AI today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* What you get section */}
              <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-sm font-semibold text-white/80 mb-3">What you'll get:</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[#fd4444]" />
                    <span className="text-sm text-white/70">Access to 100+ AI models</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-white/70">$5 free cloud credits to start</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-white/70">Secure cloud infrastructure</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Rocket className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white/70">Deploy instantly to production</span>
                  </div>
                </div>
              </div>

              {/* Signup Button */}
              <Button
                onClick={handleSignup}
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium h-12"
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
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#1a1a1a] px-2 text-white/40">
                    No credit card required
                  </span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-white/60">SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-white/60">GDPR Ready</span>
                </div>
              </div>

              {/* Footer Links */}
              <div className="pt-4 text-center space-y-2">
                <p className="text-sm text-white/60">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#fd4444] hover:text-[#ff6b6b]">
                    Sign in
                  </Link>
                </p>
                <p className="text-xs text-white/40">
                  By signing up, you agree to our{' '}
                  <Link href="/terms" className="underline hover:text-white/60">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="underline hover:text-white/60">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Social proof */}
          <div className="mt-8 text-center">
            <p className="text-sm text-white/40 mb-3">Trusted by developers at</p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <span className="text-white/60 font-semibold">OpenAI</span>
              <span className="text-white/60 font-semibold">Google</span>
              <span className="text-white/60 font-semibold">Meta</span>
              <span className="text-white/60 font-semibold">Microsoft</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}