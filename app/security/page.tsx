import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck,
  Fingerprint,
  KeyRound,
  Building2,
  Lock,
  Database,
  ScrollText,
  Server,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import Header from "@/components/layout/header";
import SiteFooter from "@/components/landing/site-footer";

export const metadata: Metadata = {
  title: "Security | Hanzo",
  description:
    "How Hanzo protects your data: single sign-on through Hanzo IAM, KMS-encrypted secrets, per-organization tenant isolation, server-side RBAC, and no training on your data.",
};

// The controls below describe what the platform DOES. Every claim maps to a
// mechanism that ships in the product (Hanzo IAM, Hanzo KMS, the org-boundary
// query scoping, the gateway's server-side RBAC). Kept honest and Hanzo-specific.
const controls = [
  {
    icon: Fingerprint,
    title: "Identity & single sign-on",
    body: "Authentication runs through Hanzo IAM — one OIDC identity provider for every surface. Bring your own SSO over SAML or OIDC, enforce MFA, and add passkeys / WebAuthn per organization. Sessions are short-lived, HttpOnly, and revocable.",
  },
  {
    icon: KeyRound,
    title: "Secrets & encryption",
    body: "Secrets live in Hanzo KMS, never in plaintext and never in a repo. Data is encrypted in transit with TLS and at rest with AES-256 envelope encryption. Keys rotate on a schedule; access to each secret is scoped and audited.",
  },
  {
    icon: Building2,
    title: "Tenant isolation on the org boundary",
    body: "Every workspace is an organization, and every request is scoped to the org derived server-side from your identity's owner claim. One tenant can never read another's projects, connectors, usage, or billing — isolation is enforced on the boundary, not left to the client.",
  },
  {
    icon: Lock,
    title: "Server-side access control",
    body: "Role-based access control is evaluated on the server for every privileged action, following least privilege and separation of duties. Organization admins manage only their own org; platform administration is a distinct, separately-provisioned scope — never a self-promotion.",
  },
  {
    icon: Database,
    title: "Your data is not our training set",
    body: "We do not train foundation models on your prompts, code, or content. Your project data is yours: used to run and improve your app, never repurposed to train shared models, and deletable on request.",
  },
  {
    icon: ScrollText,
    title: "Audit trails & monitoring",
    body: "Sensitive and privileged operations are recorded to an attributable audit trail. Structured security logs feed anomaly detection and our observability stack, with real-time status at status.hanzo.ai.",
  },
  {
    icon: Server,
    title: "Hardened infrastructure",
    body: "Workloads run on Kubernetes with network policies, minimal-privilege service accounts, non-root containers, and rate-limited, WAF-fronted ingress. Builds ship through CI/CD — no ad-hoc access to production.",
  },
  {
    icon: ShieldCheck,
    title: "Data residency & recovery",
    body: "Deploy to the region your compliance requires, with regional data residency for enterprise plans. Encrypted, point-in-time backups and tested recovery keep your data durable.",
  },
];

const compliance = [
  {
    label: "SOC 2 Type II",
    body: "Independently audited controls for security, availability, and confidentiality.",
  },
  {
    label: "GDPR & CCPA",
    body: "Data-subject rights, DPAs, and privacy-by-design across the platform.",
  },
  {
    label: "NIST 800-53 mapped",
    body: "Access, audit, and isolation controls mapped to the FedRAMP baseline for public-sector readiness.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero */}
      <section className="px-4 md:px-8 py-16 md:py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/70">
            <ShieldCheck className="h-4 w-4" />
            Trust & Security
          </span>
          <h1 className="text-4xl font-medium tracking-tight text-balance md:text-6xl">
            Security is a property of every line we ship.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            Hanzo builds and runs your apps on hardened, multi-tenant
            infrastructure — one identity provider, encrypted secrets, and strict
            isolation on the organization boundary. Here is exactly how your data
            is protected.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/enterprise"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              Enterprise & compliance
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://hanzo.ai/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              Contact security
            </a>
          </div>
        </div>
      </section>

      {/* Compliance strip */}
      <section className="px-4 md:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {compliance.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" />
                <span className="text-sm font-medium">{c.label}</span>
              </div>
              <p className="mt-2 text-sm text-white/55">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Controls grid */}
      <section className="px-4 md:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
            How your data is protected
          </h2>
          <p className="mt-2 max-w-2xl text-white/55">
            The controls that ship in the platform — not a wishlist.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2">
            {controls.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="bg-black p-6 md:p-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-4 text-base font-medium">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    {c.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Report / disclosure */}
      <section className="px-4 md:px-8 pb-20 md:pb-28">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-8 md:p-12">
          <h2 className="text-2xl font-medium tracking-tight md:text-3xl">
            Report a vulnerability
          </h2>
          <p className="mt-3 max-w-2xl text-white/60">
            We welcome responsible disclosure. If you believe you have found a
            security issue, email{" "}
            <a
              href="mailto:security@hanzo.ai"
              className="font-medium text-white underline underline-offset-4"
            >
              security@hanzo.ai
            </a>{" "}
            and we will respond promptly. Please give us a reasonable window to
            remediate before any public disclosure.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="mailto:security@hanzo.ai"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              security@hanzo.ai
            </a>
            <a
              href="https://status.hanzo.ai"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              System status
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
