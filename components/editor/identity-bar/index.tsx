"use client";

/**
 * BuilderIdentityBar — the ONE bottom-left identity cluster for the /dev builder.
 *
 * Mirrors the canonical bottom-left user/org control from hanzo.chat
 * (`client/src/components/Nav/AccountSettings.tsx`) and console.hanzo.ai
 * (`DashboardShell.tsx` SidebarIdentity): a single consolidated cluster —
 * org switcher + account (avatar / name / menu, with the credit balance the
 * gateway debits) — pinned to the bottom-left of the surface, with menus
 * opening UPWARD (`direction="up"`) since the cluster sits at the bottom edge.
 *
 * This replaces the header-mounted controls, keeping the top header minimal
 * (H + primary actions) so the chrome recedes and the generated preview is the
 * star. The composed pieces keep their own APIs; this only arranges them.
 *
 * NetworkWallet is intentionally not composed here: the canonical bottom-left
 * pattern is org + account, and the `@hanzo/ui` wallet primitives are not
 * shipped in the installed version (see components/network-wallet).
 */
import { OrgSwitcher } from "@/components/org-switcher";
import { EditorAccountMenu } from "@/components/editor/account-menu";

export function BuilderIdentityBar() {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Active org context — always scoped to one org. Opens upward. */}
      <div className="hidden sm:block min-w-0">
        <OrgSwitcher direction="up" />
      </div>
      <div className="h-6 w-px bg-neutral-800 hidden sm:block" />
      {/* Identity + credits, the primary control. Opens upward. */}
      <EditorAccountMenu direction="up" />
    </div>
  );
}
