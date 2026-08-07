"use client";

/**
 * WorkspaceMenu — the ONE top-left org/project menu for the /dev builder
 * (Hanzo true-black monochrome). It folds the whole workspace identity into a
 * single dropdown so the header stays lean:
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
import { SizableText, XStack, YStack, Paragraph } from '@hanzo/ui';
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast, Avatar, AvatarFallback, AvatarImage, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@hanzo/ui';
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


import { useUser } from "@/hooks/useUser";
import { useOrg } from "@/lib/org/client";
import { currentOrg, display, orgDisplayName, switchOrg } from "@/lib/org-scope";
import { OrgMark } from "@hanzo/ui/product";
import { gravatarUrl } from "@/lib/avatar";
import { useCloudBalance, spendableCents } from "@/lib/billing/live-balance";
import { updateProject } from "@/lib/api/projects";
import { NetworkWallet } from "@/components/network-wallet";
import type { Project } from "@/types";

const fmtUsd = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

// Shared item styling — Hanzo darker chrome: white-on-black, hairline focus,
// a crisp hover. ONE gui prop bundle, spread on every menu item.
const ITEM = {
  cursor: "pointer", gap: "$2.5", borderRadius: "$3",
  paddingHorizontal: "$2", paddingVertical: "$2", fontSize: "$3",
  color: "$color", focusStyle: { backgroundColor: "$color3" },
} as const;

// Every menu row is ONE shape: 16px icon left, label beside it, left-aligned.
// The row carries its own layout because an `asChild` item delegates rendering
// to the wrapped anchor and the item's flex props never reach it — the icon
// stacked above a centered label there, while plain items sat left. With the
// shape inside the row, alignment cannot depend on who renders the outside.
function MenuRow({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ size?: number | string }>;
  children: React.ReactNode;
}) {
  return (
    <XStack alignItems="center" gap="$2.5" width="100%">
      <Icon size={16} />
      <SizableText fontSize="$3" color="$color">{children}</SizableText>
    </XStack>
  );
}

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
          <Button
            type="button"
            title="Workspace"
            minWidth={0} alignItems="center" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" paddingHorizontal="$2.5" paddingVertical="$1.5" hoverStyle={{ borderColor: "$color02", backgroundColor: "$color3" }}
          >
            <OrgMark org={display({ name: orgId, logo: activeOrg?.logo })} size={20} />
            {/* On a phone the bar has ~220px to split between this name and
                the editor's tools, and the name was taking all of it. It is a
                LABEL; they are the controls you came for. So it gives up room
                first below $sm and keeps its full width above. */}
            <SizableText maxWidth="4.5rem" $sm={{ maxWidth: "9rem" }} numberOfLines={1} fontWeight="500" color="$color">
              {projectName}
            </SizableText>
            <ChevronsUpDown size={14} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          sideOffset={8}
          width="19rem" padding="$1.5"
        >
          {/* Back to the dashboard. */}
          <DropdownMenuItem asChild {...ITEM}>
            <Link href="/dashboard">
              <MenuRow icon={LayoutDashboard}>Go to Dashboard</MenuRow>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator marginHorizontal="$-1.5" marginVertical="$1.5" backgroundColor="$borderColor" />

          {/* Who you're signed in as. */}
          <XStack alignItems="center" gap="$2.5" paddingHorizontal="$2" paddingVertical="$1.5">
            <Avatar width={28} height={28}>
              <AvatarImage src={avatarSrc} alt={uname} />
              <AvatarFallback backgroundColor="$color3">
                <SizableText fontSize="$1" color="$color">{initial}</SizableText>
              </AvatarFallback>
            </Avatar>
            <YStack minWidth={0}>
              <Paragraph numberOfLines={1} fontSize="$3" fontWeight="500" lineHeight="1.25" color="$color">
                {uname}
              </Paragraph>
              {user.email && (
                <Paragraph numberOfLines={1} fontSize="$1" lineHeight="1.25" color="$color11">
                  {user.email}
                </Paragraph>
              )}
            </YStack>
          </XStack>

          {/* Active workspace + plan badge — a switcher when there's more than one. */}
          {canSwitch ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger display="flex" alignItems="center" gap="$2.5" borderRadius="$3" paddingHorizontal="$2" paddingVertical="$1.5" focusStyle={{ backgroundColor: "$color3" }}>
                <OrgMark org={display({ name: orgId, logo: activeOrg?.logo })} size={28} />
                <YStack minWidth={0} flex={1}>
                  <SizableText numberOfLines={1} fontSize="$3" fontWeight="500" color="$color">{orgName}</SizableText>
                  <SizableText fontSize={11} color="$color11">Switch workspace</SizableText>
                </YStack>
                <SizableText flexShrink={0} borderRadius="$3" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" paddingHorizontal="$1.5" paddingVertical="$0.5" fontSize={10} fontWeight="500" color="$color11">
                  {orgKind}
                </SizableText>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent maxHeight={288} width={256}>
                {orgs.map((o) => {
                  const isCurrent = o.name === orgId;
                  return (
                    <DropdownMenuItem
                      key={o.name}
                      onSelect={() => !isCurrent && switchOrg(o.name)}
                      cursor="pointer" gap="$2" borderRadius="$3" paddingHorizontal="$2" paddingVertical="$2" focusStyle={{ backgroundColor: "$color3" }}
                    >
                      <OrgMark org={display(o)} size={20} />
                      <SizableText minWidth={0} flex={1} numberOfLines={1} fontSize="$3" color="$color">{orgDisplayName(orgs, o.name)}</SizableText>
                      {isCurrent && <Check size={16} />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <XStack alignItems="center" gap="$2.5" paddingHorizontal="$2" paddingVertical="$1.5">
              <OrgMark org={display({ name: orgId, logo: activeOrg?.logo })} size={28} />
              <YStack minWidth={0} flex={1}>
                <SizableText numberOfLines={1} fontSize="$3" fontWeight="500" color="$color">{orgName}</SizableText>
                <SizableText fontSize={11} color="$color11">Workspace</SizableText>
              </YStack>
              <SizableText flexShrink={0} borderRadius="$3" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" paddingHorizontal="$1.5" paddingVertical="$0.5" fontSize={10} fontWeight="500" color="$color11">
                {orgKind}
              </SizableText>
            </XStack>
          )}

          {/* Credits — the balance IS the entry point: the whole card is a link to
              billing/usage (top up + see spend). No separate "Get more credits". */}
          <DropdownMenuItem asChild marginHorizontal="$0.5" marginTop="$1" borderRadius="$5" padding="$0" focusStyle={{ backgroundColor: "transparent" }}>
            <Link
              href="/billing"
            ><YStack width="100%" gap="$2" borderRadius="$5" borderWidth={1} borderColor="$borderColor" backgroundColor="$color2" paddingHorizontal="$3" paddingVertical="$2.5" hoverStyle={{ borderColor: "$color02", backgroundColor: "$color3" }} focusVisibleStyle={{ borderColor: "$color02" }}>
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$1.5">
                  <Wallet size={14} />
                  <SizableText fontSize="$1" fontWeight="500" color="$color">Credits</SizableText>
                </XStack>
                <SizableText fontFamily="$mono" fontSize="$3" fontVariant={["tabular-nums"]} color="$color">{balanceText}</SizableText>
              </XStack>
              <YStack
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Credits spendable"
                height="$1.5" width="100%" overflow="hidden" borderRadius="$10" backgroundColor="$color3"
              >
                <YStack
                  height="100%" borderRadius="$10" backgroundColor="var(--brand-accent)"
                  style={{ width: `${pct}%` }}
  />
              </YStack>
              <SizableText numberOfLines={1} fontSize={11} color="$color11">{creditHint}</SizableText>
            </YStack></Link>
          </DropdownMenuItem>

          {/* Wallet — the non-custodial injected connector, folded in here. */}
          <YStack paddingHorizontal="$1" paddingVertical="$1">
            <NetworkWallet />
          </YStack>

          <DropdownMenuSeparator marginHorizontal="$-1.5" marginVertical="$1.5" backgroundColor="$borderColor" />

          <DropdownMenuItem asChild {...ITEM}>
            <Link href="/settings">
              <MenuRow icon={Settings}>Settings</MenuRow>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild {...ITEM}>
            <Link href="/connectors">
              <MenuRow icon={Plug}>Project connectors</MenuRow>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem {...ITEM} onSelect={() => openRename()}>
            <MenuRow icon={Pencil}>Rename project</MenuRow>
          </DropdownMenuItem>
          <DropdownMenuItem {...ITEM} onSelect={() => setDetailsOpen(true)}>
            <MenuRow icon={Info}>Project details</MenuRow>
          </DropdownMenuItem>
          <DropdownMenuItem asChild {...ITEM}>
            <a href="https://hanzo.ai/docs" target="_blank" rel="noopener noreferrer">
              <MenuRow icon={LifeBuoy}>Help</MenuRow>
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator marginHorizontal="$-1.5" marginVertical="$1.5" backgroundColor="$borderColor" />

          <DropdownMenuItem
            onSelect={() => void logout()}
            {...ITEM}
          >
            <MenuRow icon={LogOut}>Sign out</MenuRow>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename — a small modal so the menu's typeahead never fights the input. */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent maxWidth={384} borderColor="$borderColor" backgroundColor="$background">
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription color="$color11">
              {slug
                ? "Updates the project name across your Hanzo tools."
                : "Sets the name this project publishes under."}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            autoFocus
            placeholder="Project name"
            onChangeText={(v: string) => setRenameValue(v)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!renaming) void submitRename();
              }
            }}
            borderColor="$borderColor" backgroundColor="$color2" color="$color"
  />
          <XStack justifyContent="flex-end" gap="$2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenameOpen(false)}
              borderColor="$borderColor" backgroundColor="transparent" hoverStyle={{ backgroundColor: "$color3" }}
              disabled={renaming}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void submitRename()}
              disabled={renaming || !renameValue.trim()}
              backgroundColor="$color5" borderWidth={1} borderColor="$color6" hoverStyle={{ backgroundColor: "$color6" }}
            >
              {renaming ? "Saving…" : "Save"}
            </Button>
          </XStack>
        </DialogContent>
      </Dialog>

      {/* Project details — real known fields only. */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent maxWidth={384} borderColor="$borderColor" backgroundColor="$background">
          <DialogHeader>
            <DialogTitle>Project details</DialogTitle>
            <DialogDescription color="$color11">
              {slug ? "This project is saved to your workspace." : "This project isn’t published yet."}
            </DialogDescription>
          </DialogHeader>
          <YStack rowGap="$2">
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
          </YStack>
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
    <XStack alignItems="center" justifyContent="space-between" gap="$3">
      <SizableText fontSize="$3" color="$color11">{label}</SizableText>
      <SizableText minWidth={0} numberOfLines={1} color="$color" {...{ fontFamily: mono ? "$mono" : undefined, fontSize: mono ? "$1" : "$3" }}>
        {value}
      </SizableText>
    </XStack>
  );
}
