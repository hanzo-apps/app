import Link from 'next/link';
import { HanzoBrand } from '@/components/HanzoLogo';

/**
 * 404 — Next.js renders this for any unmatched route. Server component (no
 * client state), true-black monochrome to match /login: the canonical HanzoBrand
 * lockup, a plain heading, one white pill back home, one ghost link to the
 * dashboard.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-10">
          <HanzoBrand
            className="text-white"
            markClassName="w-11 h-11"
            wordmarkClassName="text-3xl"
          />
        </div>

        <h1 className="text-4xl font-medium mb-4 tracking-tight">404 — page not found</h1>
        <p className="text-white/50 text-lg mb-10">This page does not exist or has moved.</p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-5 py-2.5 bg-white text-black rounded-xl font-medium text-sm hover:bg-white/90 transition-colors"
          >
            Back to Hanzo
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
