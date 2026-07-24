// site-footer.tsx — the UNIFIED Hanzo ecosystem footer + the product-specific
// pre-footer CTA. Both render from the ONE canonical config (lib/hanzo-ecosystem),
// so the footer is byte-identical across every Hanzo property and only the current
// product's highlight + the pre-footer message change. Lift this into @hanzo/ui to
// share verbatim; hanzo.app is the reference implementation.

import Link from "next/link";
import { HanzoBrand } from "@/components/HanzoLogo";
import {
  FOOTER_COLUMNS, FOOTER_BOTTOM, COPYRIGHT, PRODUCTS,
  PRE_FOOTER, CURRENT_SITE, HEADERS, type NavLink,
} from "@/lib/hanzo-ecosystem";

const currentProduct = HEADERS[CURRENT_SITE]?.product;
const currentName = currentProduct ? PRODUCTS[currentProduct]?.name : undefined;

// A footer link. An href on another Hanzo property opens in place (same tab —
// it's one ecosystem); highlight the row for the CURRENT product so a visitor
// always knows where they are.
function FootLink({ link }: { link: NavLink }) {
  const isExternal = /^https?:\/\//.test(link.href);
  const isCurrent = link.label === currentName;
  const cls = `text-sm transition-colors ${
    isCurrent
      ? "text-foreground font-medium"
      : "text-foreground/55 hover:text-foreground"
  }`;
  return isExternal ? (
    <a href={link.href} className={cls}>
      {link.label}
      {isCurrent && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-foreground/40">you are here</span>}
    </a>
  ) : (
    <Link href={link.href} className={cls}>{link.label}</Link>
  );
}

// PreFooterCTA — the product-specific call to action placed IMMEDIATELY above the
// shared footer. Message + actions come from the canonical PRE_FOOTER map.
export function PreFooterCTA() {
  const cta = PRE_FOOTER[CURRENT_SITE];
  if (!cta) return null;
  return (
    <section className="border-t border-border px-4 py-16 md:px-8 md:py-20">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <h2 className="text-balance text-2xl font-medium tracking-tight md:text-3xl">
          {cta.message}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {cta.actions.map((a, i) => {
            const primary = i === 0;
            const cls = primary
              ? "rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              : "rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/[0.04]";
            return /^https?:\/\//.test(a.href) ? (
              <a key={a.label} href={a.href} className={cls}>{a.label}</a>
            ) : (
              <Link key={a.label} href={a.href} className={cls}>{a.label}</Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-16">
        {/* Brand + columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/40">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.label + l.href}><FootLink link={l} /></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <div className="flex items-center gap-3">
            <HanzoBrand />
            <span className="text-xs text-foreground/40">{COPYRIGHT}</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {FOOTER_BOTTOM.map((l) => (
              <a key={l.label} href={l.href} className="text-xs text-foreground/45 transition-colors hover:text-foreground">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
