'use client';

/**
 * ModeSwitcher — the ONE control for hanzo.app's three modes (CTO direction:
 * one webapp, modes chat | dev | work). A segmented control that routes to the
 * mode's canonical route and highlights the active one from the pathname.
 * Mounted by the AppShell and by full-bleed mode surfaces (chat) that own
 * their chrome — one component, every mount.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const MODES = [
  { id: 'chat', label: 'Chat', route: '/chat' },
  { id: 'dev', label: 'Dev', route: '/dev' },
  { id: 'work', label: 'Work', route: '/work' },
] as const;

export function ModeSwitcher({ className }: { className?: string }) {
  const pathname = usePathname() || '';
  return (
    <nav
      aria-label="App mode"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5',
        className,
      )}
    >
      {MODES.map((m) => {
        const active = pathname === m.route || pathname.startsWith(`${m.route}/`);
        return (
          <Link
            key={m.id}
            href={m.route}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1 text-sm transition-colors',
              active
                ? 'bg-[var(--brand-accent-soft)] text-[var(--brand-accent-muted)]'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default ModeSwitcher;
