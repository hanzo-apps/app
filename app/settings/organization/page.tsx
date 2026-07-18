"use client";

/**
 * Organization settings — the proper home for the org's identity mark (moved
 * OUT of the OrgSwitcher dropdown, which stays a switcher). Shows the current
 * org and an emoji picker that live-previews via <OrgAvatar> and persists via
 * the shared `lib/avatar` override (localStorage) until IAM carries a real org
 * `logo` through `/v1/orgs`. Monochrome; matches the dashboard chrome.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { HanzoLogo } from "@/components/HanzoLogo";
import { OrgAvatar } from "@/components/org-switcher";
import { OrgProvider, useOrg } from "@/lib/org/client";
import { currentOrg, orgDisplayName } from "@/lib/org-scope";
import { readOrgLogoOverride, setOrgLogoOverride, isEmoji } from "@/lib/avatar";
import { useUser } from "@/hooks/useUser";

function OrganizationSettingsInner() {
  const { ctx, loading } = useOrg();

  // The effective org (mirrors OrgSwitcher): a localStorage scope override wins,
  // else the server's current org.
  const currentId = currentOrg() || ctx?.currentOrg || "";
  const org = ctx?.orgs.find((o) => o.name === currentId);
  const name = orgDisplayName(ctx?.orgs ?? [], currentId) || "…";
  const serverLogo = org?.logo;

  // The client-side emoji override (localStorage) — the value of the picker.
  // Seeded from storage when the scope changes; OrgAvatar reads the same
  // override FIRST, so the preview updates the moment a valid emoji is set.
  const [emoji, setEmoji] = useState("");
  useEffect(() => setEmoji(readOrgLogoOverride(currentId)), [currentId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-black">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-medium text-white">Organization settings</h1>
        <p className="mt-1 text-sm text-white/50">
          Personalize how {name} appears across Hanzo.
        </p>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6">
          {/* Current org — avatar live-previews the picked emoji. */}
          <div className="flex items-center gap-4">
            <OrgAvatar name={name} logo={serverLogo} className="h-12 w-12 text-lg" />
            <div className="min-w-0">
              <div className="truncate font-medium text-white">{name}</div>
              {currentId && (
                <div className="truncate font-mono text-xs text-white/40">{currentId}</div>
              )}
            </div>
          </div>

          {/* Emoji picker — persists to the shared override. */}
          <div className="mt-6">
            <label htmlFor="org-emoji" className="mb-2 block text-sm font-medium text-white/70">
              Emoji
            </label>
            <div className="flex items-center gap-3">
              <input
                id="org-emoji"
                value={emoji}
                onChange={(e) => {
                  const v = e.target.value.slice(0, 4);
                  setEmoji(v);
                  // Persist only a real emoji (or a clear) — never garbage.
                  if (!v || isEmoji(v)) setOrgLogoOverride(currentId, v);
                }}
                placeholder="⚡"
                maxLength={4}
                aria-label={`Set an emoji for ${name}`}
                disabled={!currentId}
                className="w-16 rounded-lg border border-white/15 bg-transparent px-2 py-2 text-center text-lg outline-none focus:border-white/40 disabled:opacity-40"
              />
              <p className="text-xs text-white/40">
                Pick a single emoji to represent the org. Leave empty to fall back to the
                org&apos;s initial.
              </p>
            </div>
          </div>

          <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/35">
            An uploaded image logo will be supported once Hanzo IAM carries it for your
            organization. Until then, this emoji is stored on this device.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationSettingsPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <HanzoLogo className="mx-auto mb-4 h-12 w-12 animate-pulse text-white" />
          <p className="text-white/40">
            {loading ? "Loading settings..." : "Redirecting to login..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell currentView="settings">
      <OrgProvider>
        <OrganizationSettingsInner />
      </OrgProvider>
    </AppShell>
  );
}
