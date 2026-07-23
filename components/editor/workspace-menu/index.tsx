"use client";

/**
 * WorkspaceMenu — the ONE top-left org/project menu for the /dev builder
 * (Lovable structure, Hanzo true-black monochrome). It folds the whole
 * workspace identity into a single dropdown so the header stays lean:
 *
 *   trigger   org mark + project/workspace name + chevron (the left anchor)
 *   content   Go to Dashboard · who you're signed in as · active workspace
 *             (+ switch when you belong to more than one) · a LIVE credits
 *             meter · Get more credits · Wallet · Settings · Rename project ·
 *             Project details · Help · Sign out
 *
 * Honesty (this app's law):
 *  - Identity comes from the signed-in IAM account (`useUser`); the org from the
 *    same scope the OrgSwitcher uses (`useOrg` + `org-scope`).
 *  - The credit number is the ONE shared live store (`useCloudBalance`) — the
 *    exact per-org credit the gateway debits, never fabricated. Not ready ⇒ "—".
 *  - Rename PATCHes the real project when one exists (`updateProject`); for an
 *    unpublished draft it updates the name publish will use — no fake success.
 *
 * Strictly monochrome: black / white / neutral, semantic green/red only.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "@hanzo/ui";
import {
  Check,
  ChevronsUpDown,
  Info,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Pencil,
  Plug,
  Settings,
  Wallet,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Input,
} from "@hanzo/ui";

import { useUser } from "@/hooks/useUser";
import { useOrg } from "@/lib/org/client";
import { currentOrg, orgDisplayName, switchOrg } from "@/lib/org-scope";
import { OrgAvatar } from "@/components/org-switcher";
import { gravatarUrl } from "@/lib/avatar";
import { useCloudBalance, spendableCents } from "@/lib/billing/live-balance";
import { updateProject } from "@/lib/api/projects";
import { NetworkWallet } from "@/components/network-wallet";
import type { Project } from "@/types";

const fmtUsd = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

// Shared item styling — Hanzo darker chrome: white-on-black, hairline focus,
// a crisp 150ms hover.
const ITEM =
  "cursor-pointer gap-2.5 rounded-md px-2 py-2 text-sm text-foreground transition-colors duration-150 focus:bg-white/[0.06] focus:text-foreground";
const ICON = "size-4 shrink-0 text-muted-foreground";

export function WorkspaceMenu({
  project,
  onRenamed,
}: {
  project?: Project | null;
  /** Notify the editor that the project's display name changed (draft rename). */
  onRenamed?: (name: string) => void;
}) {
  const { user, logout } = useUser();
  const { ctx } = useOrg();
  const { phase, balance } = useCloudBalance();

  // Project name the builder staged (template/import) — window-scoped, so read
  // it client-only. The real `project.title` wins when a project is loaded.
  const [stagedName, setStagedName] = useState<string | null>(null);
  useEffect(() => {
    const w = window as unknown as { __projectName?: string };
    setStagedName(w.__projectName || null);
  }, []);

  // Active org scope — resolved exactly like the OrgSwitcher, so the workspace
  // names the ORG the credits attribute to (never the person).
  const orgId = currentOrg() || ctx?.currentOrg || "";
  const orgName = orgDisplayName(ctx?.orgs ?? [], orgId) || "Workspace";
  const orgs = ctx?.orgs ?? [];
  const activeOrg = orgs.find((o) => o.name === orgId);
  const orgKind = activeOrg?.isPersonal ? "Personal" : "Team";
  const canSwitch = orgs.length > 1;

  // A just-applied rename (`stagedName`) wins so the trigger updates instantly,
  // then the loaded project's title, then the org, then a neutral placeholder.
  const projectName = stagedName || project?.title || orgName || "Untitled";
  const slug = project?.space_id;

  // Credits — the real per-org balance + a real spendable ratio (holds are the
  // consumed remainder). Only drawn from real fields; never a fabricated quota.
  const cents = spendableCents(balance);
  const ready = phase === "ready" && cents !== null;
  const balanceText = ready ? fmtUsd(cents as number) : "—";
  const total = typeof balance?.balance === "number" ? balance.balance : null;
  const holds = typeof balance?.holds === "number" ? balance.holds : null;
  const pct = ready
    ? total !== null && total > 0
      ? Math.max(0, Math.min(100, Math.round(((cents ?? 0) / total) * 100)))
      : 100
    : 0;
  const creditHint =
    phase === "unconfigured"
      ? "Billing not set up on this workspace"
      : phase === "noauth"
        ? "Sign in to view credits"
        : phase === "error"
          ? "Couldn’t load balance"
          : !ready
            ? "Loading balance…"
            : holds !== null && holds > 0
              ? `${fmtUsd(holds)} on hold`
              : "Credits debit as you build";

  // Rename — PATCH a real project, else update the name publish will use.
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const openRename = () => {
    setRenameValue(projectName === "Untitled" ? "" : projectName);
    setRenameOpen(true);
  };
  const submitRename = async () => {
    const name = renameValue.trim();
    if (!name) return;
    setRenaming(true);
    try {
      if (slug) await updateProject(slug, { name });
      (window as unknown as { __projectName?: string }).__projectName = name;
      setStagedName(name);
      onRenamed?.(name);
      toast.success(slug ? "Project renamed" : "Name updated — applies on publish");
      setRenameOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn’t rename project");
    } finally {
      setRenaming(false);
    }
  };

  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!user) return null;

  const uname = user.fullname || user.name || "Account";
  const initial = uname.charAt(0).toUpperCase();
  const gravatar = user.email ? gravatarUrl(user.email, 64) : "";
  const avatarSrc = user.avatarUrl || gravatar || undefined;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Workspace"
            className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-white/[0.02] px-2.5 py-1.5 text-sm text-foreground transition-all duration-150 hover:border-border hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 data-[state=open]:border-border data-[state=open]:bg-white/[0.06]"
          >
            <OrgAvatar name={orgName} logo={activeOrg?.logo} />
            <span className="max-w-[9rem] truncate font-medium text-foreground">
              {projectName}
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="bottom"
          align="start"
          sideOffset={8}
          className="w-[19rem] rounded-xl border border-border bg-card/95 p-1.5 text-foreground shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          {/* Back to the dashboard. */}
          <DropdownMenuItem asChild className={ITEM}>
            <Link href="/dashboard">
              <LayoutDashboard className={ICON} />
              Go to Dashboard
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="-mx-1.5 my-1.5 bg-border" />

          {/* Who you're signed in as. */}
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <Avatar className="size-7">
              <AvatarImage src={avatarSrc} alt={uname} />
              <AvatarFallback className="bg-muted text-xs text-foreground">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight text-foreground">
                {uname}
              </p>
              {user.email && (
                <p className="truncate text-xs leading-tight text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          {/* Active workspace + plan badge — a switcher when there's more than one. */}
          {canSwitch ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors duration-150 focus:bg-white/[0.06] focus:text-foreground data-[state=open]:bg-white/[0.06]">
                <OrgAvatar name={orgName} logo={activeOrg?.logo} className="size-7 text-[11px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{orgName}</span>
                  <span className="block text-[11px] text-muted-foreground">Switch workspace</span>
                </span>
                <span className="shrink-0 rounded-md border border-border bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {orgKind}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-72 w-64 overflow-y-auto rounded-lg border border-border bg-card/95 p-1 text-foreground shadow-2xl backdrop-blur-xl">
                {orgs.map((o) => {
                  const isCurrent = o.name === orgId;
                  return (
                    <DropdownMenuItem
                      key={o.name}
                      onSelect={() => !isCurrent && switchOrg(o.name)}
                      className="cursor-pointer gap-2 rounded-md px-2 py-2 text-sm text-foreground transition-colors duration-150 focus:bg-white/[0.06] focus:text-foreground"
                    >
                      <OrgAvatar name={orgDisplayName(orgs, o.name)} logo={o.logo} />
                      <span className="min-w-0 flex-1 truncate">{orgDisplayName(orgs, o.name)}</span>
                      {isCurrent && <Check className="size-4 shrink-0 text-foreground" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <OrgAvatar name={orgName} logo={activeOrg?.logo} className="size-7 text-[11px]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{orgName}</span>
                <span className="block text-[11px] text-muted-foreground">Workspace</span>
              </span>
              <span className="shrink-0 rounded-md border border-border bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {orgKind}
              </span>
            </div>
          )}

          {/* Credits — the balance IS the entry point: the whole card is a link to
              billing/usage (top up + see spend). No separate "Get more credits". */}
          <DropdownMenuItem asChild className="mx-0.5 mt-1 rounded-lg p-0 focus:bg-transparent">
            <Link
              href="/billing"
              className="flex w-full flex-col gap-2 rounded-lg border border-border bg-white/[0.03] px-3 py-2.5 transition-colors hover:border-border hover:bg-white/[0.05] focus-visible:border-border"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Wallet className="size-3.5 text-muted-foreground" />
                  Credits
                </span>
                <span className="font-mono text-sm tabular-nums text-foreground">{balanceText}</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Credits spendable"
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-white/70 to-white transition-[width] duration-700 ease-out motion-reduce:transition-none"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="truncate text-[11px] text-muted-foreground">{creditHint}</span>
            </Link>
          </DropdownMenuItem>

          {/* Wallet — the non-custodial injected connector, folded in here. */}
          <div className="px-1 py-1">
            <NetworkWallet />
          </div>

          <DropdownMenuSeparator className="-mx-1.5 my-1.5 bg-border" />

          <DropdownMenuItem asChild className={ITEM}>
            <Link href="/settings">
              <Settings className={ICON} />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={ITEM}>
            <Link href="/connectors">
              <Plug className={ICON} />
              Project connectors
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => openRename()}>
            <Pencil className={ICON} />
            Rename project
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => setDetailsOpen(true)}>
            <Info className={ICON} />
            Project details
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={ITEM}>
            <a href="https://hanzo.ai/docs" target="_blank" rel="noopener noreferrer">
              <LifeBuoy className={ICON} />
              Help
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="-mx-1.5 my-1.5 bg-border" />

          <DropdownMenuItem
            onSelect={() => void logout()}
            className={`${ITEM} text-foreground`}
          >
            <LogOut className="size-4 shrink-0" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename — a small modal so the menu's typeahead never fights the input. */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {slug
                ? "Updates the project name across your Hanzo tools."
                : "Sets the name this project publishes under."}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            autoFocus
            placeholder="Project name"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenameValue(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!renaming) void submitRename();
              }
            }}
            className="!border-border !bg-white/[0.04] !text-foreground selection:!bg-white/20"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenameOpen(false)}
              className="!border-border !bg-transparent !text-foreground hover:!bg-muted"
              disabled={renaming}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void submitRename()}
              disabled={renaming || !renameValue.trim()}
              className="!bg-primary font-medium !text-primary-foreground hover:!bg-primary/90"
            >
              {renaming ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project details — real known fields only. */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-sm border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Project details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {slug ? "This project is saved to your workspace." : "This project isn’t published yet."}
            </DialogDescription>
          </DialogHeader>
          <dl className="space-y-2 text-sm">
            <DetailRow label="Name" value={projectName} />
            <DetailRow label="Workspace" value={orgName} />
            <DetailRow label="Plan" value={orgKind} />
            {slug && <DetailRow label="Project ID" value={slug} mono />}
            {project?._createdAt && (
              <DetailRow
                label="Created"
                value={new Date(project._createdAt).toLocaleDateString()}
              />
            )}
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 truncate text-foreground ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
