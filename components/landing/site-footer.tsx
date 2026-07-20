// Refined multi-column footer. Internal links point at real hanzo.app routes
// (Community/Pricing/Enterprise/Learn/Gallery exist); product, company and
// legal links point at the real pages on hanzo.ai and docs.hanzo.ai. No dead
// invented routes.

import Link from "next/link";
import { HanzoBrand } from "@/components/HanzoLogo";

interface Col {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}

const columns: Col[] = [
  {
    title: "Product",
    links: [
      { label: "Apps", href: "/install" },
      { label: "Community", href: "/community" },
      { label: "Gallery", href: "/gallery" },
      { label: "Pricing", href: "/pricing" },
      { label: "Enterprise", href: "/enterprise" },
      { label: "Learn", href: "/learn" },
    ],
  },
  {
    title: "Cloud",
    links: [
      { label: "Hanzo Cloud", href: "https://hanzo.ai/cloud", external: true },
      { label: "Base (Database)", href: "https://hanzo.ai/base", external: true },
      { label: "IAM (Auth)", href: "https://hanzo.ai/iam", external: true },
      { label: "LLM Gateway", href: "https://hanzo.ai/llm", external: true },
      { label: "KMS (Secrets)", href: "https://hanzo.ai/kms", external: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "https://docs.hanzo.ai", external: true },
      { label: "Blog", href: "https://hanzo.ai/blog", external: true },
      { label: "GitHub", href: "https://github.com/hanzoai", external: true },
      { label: "Status", href: "https://status.hanzo.ai", external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "https://hanzo.ai/about", external: true },
      { label: "Careers", href: "https://hanzo.ai/careers", external: true },
      { label: "Press", href: "https://hanzo.ai/press", external: true },
      { label: "Contact", href: "https://hanzo.ai/contact", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "https://hanzo.ai/privacy", external: true },
      { label: "Terms", href: "https://hanzo.ai/terms", external: true },
      { label: "Security", href: "https://hanzo.ai/security", external: true },
    ],
  },
];

const social = [
  {
    label: "X",
    href: "https://twitter.com/hanzoai",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "GitHub",
    href: "https://github.com/hanzoai",
    path: "M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.607.069-.607 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z",
  },
  {
    label: "Discord",
    href: "https://discord.gg/hanzoai",
    path: "M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.369a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z",
  },
];

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] px-4 pb-10 pt-16 md:px-8 md:pt-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <HanzoBrand
              className="text-white"
              markClassName="h-7 w-7"
              wordmarkClassName="text-lg font-medium"
            />
            <p className="mt-4 max-w-[15rem] text-sm leading-relaxed text-white/45">
              Describe an app. Hanzo builds it and ships it on Hanzo Cloud.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-medium text-white">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/45 transition-colors hover:text-white"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm text-white/45 transition-colors hover:text-white"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} Hanzo AI, Inc. · Techstars &apos;17
          </p>
          <div className="flex items-center gap-5">
            {social.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-white/35 transition-colors hover:text-white"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
