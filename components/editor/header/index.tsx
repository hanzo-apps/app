import { ReactNode } from "react";
import { Eye, MessageCircleCode } from "lucide-react";
import Link from "next/link";

import { HanzoLogo } from "@/components/HanzoLogo";
import { OrgSwitcher } from "@/components/org-switcher";
import { EditorAccountMenu } from "@/components/editor/account-menu";

import { Button } from "@hanzo/ui";
import classNames from "classnames";

const TABS = [
  {
    value: "chat",
    label: "Chat",
    icon: MessageCircleCode,
  },
  {
    value: "preview",
    label: "Preview",
    icon: Eye,
  },
];

export function Header({
  tab,
  onNewTab,
  children,
}: {
  tab: string;
  onNewTab: (tab: string) => void;
  children?: ReactNode;
}) {
  return (
    <header className="border-b bg-neutral-200 border-neutral-300 dark:bg-neutral-950 dark:border-neutral-800 px-3 lg:px-6 py-2 flex items-center max-lg:gap-3 justify-between lg:grid lg:grid-cols-3 z-20">
      <div className="flex items-center justify-start gap-3 min-w-0">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <HanzoLogo className="w-8 h-8 text-white group-hover:text-white/80 transition-colors" />
          <span className="hidden md:inline font-semibold text-white">Hanzo Dev</span>
        </Link>
        <div className="h-6 w-px bg-neutral-700 hidden sm:block" />
        {/* Active org context — the builder is always scoped to one org. */}
        <div className="hidden sm:block min-w-0">
          <OrgSwitcher />
        </div>
      </div>
      <div className="flex items-center justify-start lg:justify-center gap-1 max-lg:pl-3 flex-1 max-lg:border-l max-lg:border-l-neutral-800">
        {TABS.map((item) => (
          <Button
            key={item.value}
            variant={tab === item.value ? "secondary" : "ghost"}
            className={classNames("", {
              "opacity-60": tab !== item.value,
            })}
            size="sm"
            onClick={() => onNewTab(item.value)}
          >
            <item.icon className="size-4" />
            <span className="hidden md:inline">{item.label}</span>
          </Button>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 lg:gap-3">
        {children}
        <div className="h-6 w-px bg-neutral-700 hidden md:block" />
        <EditorAccountMenu />
      </div>
    </header>
  );
}
