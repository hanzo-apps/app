import classNames from "classnames";
import { FaMobileAlt } from "react-icons/fa";
import { HelpCircle, LogIn, RefreshCcw, SparkleIcon } from "lucide-react";
import { FaLaptopCode } from "react-icons/fa6";
import { HtmlHistory, Page } from "@/types";
import { Button } from "@hanzo/ui";
import { MdAdd } from "react-icons/md";
import { History } from "@/components/editor/history";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { useLocalStorage } from "react-use";
import { isTheSameHtml } from "@/lib/compare-html-diff";

const DEVICES = [
  {
    name: "desktop",
    icon: FaLaptopCode,
  },
  {
    name: "mobile",
    icon: FaMobileAlt,
  },
];

export function Footer({
  pages,
  isNew = false,
  htmlHistory,
  setPages,
  device,
  setDevice,
  iframeRef,
}: {
  pages: Page[];
  isNew?: boolean;
  htmlHistory?: HtmlHistory[];
  device: "desktop" | "mobile";
  setPages: (pages: Page[]) => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  setDevice: React.Dispatch<React.SetStateAction<"desktop" | "mobile">>;
}) {
  const { user, openLoginWindow } = useUser();

  const handleRefreshIframe = () => {
    if (iframeRef?.current) {
      const iframe = iframeRef.current;
      const content = iframe.srcdoc;
      iframe.srcdoc = "";
      setTimeout(() => {
        iframe.srcdoc = content;
      }, 10);
    }
  };

  const [, setStorage] = useLocalStorage("pages");
  const handleClick = async () => {
    if (pages && !isTheSameHtml(pages[0].html)) {
      setStorage(pages);
    }
    openLoginWindow();
  };

  return (
    <footer className="border-t bg-neutral-950 border-neutral-800 px-3 py-2 flex items-center justify-between sticky bottom-0 z-20">
      <div className="flex items-center gap-2 min-w-0">
        {user ? (
          user?.isLocalUse ? (
            <div className="max-w-max rounded-full border border-neutral-700 bg-neutral-800/60 px-3 py-1 text-sm font-medium text-neutral-300">
              Local Usage
            </div>
          ) : (
            /* Identity (org switcher + account/credits) now lives in the top-left
               header chrome (Lovable-style), so nothing renders here. */
            null
          )
        ) : (
          <Button size="sm" variant="default" onClick={handleClick}>
            <LogIn className="text-sm" />
            Log In
          </Button>
        )}
        {user && !isNew && <p className="text-neutral-700">|</p>}
        {!isNew && (
          <Link href="/dev">
            <Button size="sm" variant="secondary">
              <MdAdd className="text-sm" />
              New <span className="max-lg:hidden">Project</span>
            </Button>
          </Link>
        )}
        {htmlHistory && htmlHistory.length > 0 && (
          <>
            <p className="text-neutral-700">|</p>
            <History history={htmlHistory} setPages={setPages} />
          </>
        )}
      </div>
      <div className="flex justify-end items-center gap-2.5">
        <Link href="/gallery">
          <Button size="sm" variant="ghost">
            <SparkleIcon className="size-3.5" />
            <span className="max-lg:hidden">Hanzo Gallery</span>
          </Button>
        </Link>
        <Link href="/help">
          <Button size="sm" variant="outline">
            <HelpCircle className="size-3.5" />
            <span className="max-lg:hidden">Help</span>
          </Button>
        </Link>
        <Button size="sm" variant="outline" onClick={handleRefreshIframe}>
          <RefreshCcw className="size-3.5" />
          <span className="max-lg:hidden">Refresh Preview</span>
        </Button>
        {/* Device switcher — a clean segmented tab control (desktop / mobile),
            matching the header view switcher. Preview-frame only, so it stays
            hidden below `lg` where there's no room for the phone frame. */}
        <div
          role="tablist"
          aria-label="Preview device"
          className="flex items-center gap-0.5 rounded-lg bg-neutral-900 p-0.5 ring-1 ring-neutral-800 max-lg:hidden"
        >
          {DEVICES.map((deviceItem) => {
            const active = device === deviceItem.name;
            return (
              <button
                key={deviceItem.name}
                type="button"
                role="tab"
                aria-selected={active}
                title={`${deviceItem.name[0].toUpperCase()}${deviceItem.name.slice(1)} preview`}
                className={classNames(
                  "flex size-7 items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                  active
                    ? "bg-neutral-700 text-white shadow-sm"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                )}
                onClick={() =>
                  setDevice(deviceItem.name as "desktop" | "mobile")
                }
              >
                <deviceItem.icon />
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
