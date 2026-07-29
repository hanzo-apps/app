import { useLocalStorage } from "react-use";
import { Button } from "@hanzo/ui";
import { Dialog, DialogContent, DialogTitle } from "@hanzo/ui";
import { CheckCheck } from "lucide-react";
import { isTheSameHtml } from "@/lib/compare-html-diff";
import { Page } from "@/types";

export const ProModal = ({
  open,
  pages,
  onClose,
}: {
  open: boolean;
  pages: Page[];
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [, setStorage] = useLocalStorage("pages");
  const handleProClick = () => {
    if (pages && !isTheSameHtml(pages?.[0].html)) {
      setStorage(pages);
    }
    window.open("/pricing", "_blank");
    onClose(false);
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg lg:!p-8 !rounded-xl bg-card text-foreground border-border">
        <DialogTitle className="hidden" />
        <main className="flex flex-col items-start text-left relative pt-2">
          <div className="flex items-center justify-start -space-x-4 mb-5">
            <div className="size-14 rounded-full bg-muted border border-border shadow-2xs flex items-center justify-center text-3xl">
              🚀
            </div>
            <div className="size-16 rounded-full bg-secondary border border-border shadow-lg flex items-center justify-center text-4xl z-2">
              🤩
            </div>
            <div className="size-14 rounded-full bg-muted border border-border shadow-2xs flex items-center justify-center text-3xl">
              🥳
            </div>
          </div>
          <h2 className="text-2xl font-medium text-foreground">
            Only $9 to enhance your possibilities
          </h2>
          <p className="text-muted-foreground text-base mt-2 max-w-sm">
            It seems like you have reached the monthly free limit of Hanzo.
          </p>
          <hr className="border-border w-full max-w-[150px] my-6" />
          <p className="text-lg mt-3 text-foreground font-medium">
            Upgrade to a <ProTag className="mx-1" /> Account, and unlock your
            Hanzo high quota access ⚡
          </p>
          <ul className="mt-3 space-y-1 text-muted-foreground">
            <li className="text-sm text-muted-foreground space-x-2 flex items-center justify-start gap-2 mb-3">
              You&apos;ll also unlock PRO features, like:
            </li>
            <li className="text-sm space-x-2 flex items-center justify-start gap-2">
              <CheckCheck className="text-[var(--brand-accent-muted)] size-4" />
              Get acces to thousands of AI app (ZeroGPU) with high quota
            </li>
            <li className="text-sm space-x-2 flex items-center justify-start gap-2">
              <CheckCheck className="text-[var(--brand-accent-muted)] size-4" />
              Get exclusive early access to new features and updates
            </li>
            <li className="text-sm space-x-2 flex items-center justify-start gap-2">
              <CheckCheck className="text-[var(--brand-accent-muted)] size-4" />
              Get free credits across all Inference Providers
            </li>
            <li className="text-sm text-muted-foreground space-x-2 flex items-center justify-start gap-2 mt-3">
              ... and lots more!
            </li>
          </ul>
          <Button
            size="lg"
            className="w-full !text-base !h-11 mt-8"
            onClick={handleProClick}
          >
            Subscribe to PRO ($9/month)
          </Button>
        </main>
      </DialogContent>
    </Dialog>
  );
};

const ProTag = ({ className }: { className?: string }) => (
  <span
    className={`${className} inline-block -skew-x-12 rounded-md border border-border bg-[var(--brand-accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand-accent-muted)]`}
  >
    PRO
  </span>
);
export default ProModal;
