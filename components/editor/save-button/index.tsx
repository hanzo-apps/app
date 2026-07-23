/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast } from "@hanzo/ui";
import { MdSave } from "react-icons/md";
import { useParams } from "next/navigation";

import Loading from "@/components/loading";
import { Button } from "@hanzo/ui";
import { api } from "@/lib/api";
import { Page } from "@/types";

export function SaveButton({
  pages,
  prompts,
}: {
  pages: Page[];
  prompts: string[];
}) {
  // get params from URL
  const { namespace, repoId } = useParams<{
    namespace: string;
    repoId: string;
  }>();
  const [loading, setLoading] = useState(false);

  const updateSpace = async () => {
    setLoading(true);

    try {
      const res = await api.put(`/me/projects/${namespace}/${repoId}`, {
        pages,
        prompts,
      });
      if (res.data.ok) {
        toast.success("Your space is updated! 🎉", {
          action: {
            label: "See Space",
            onClick: () => {
              window.open(
                `/projects/${namespace}/${repoId}`,
                "_blank"
              );
            },
          },
        });
      } else {
        toast.error(res?.data?.error || "Failed to update space");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };
  // Same treatment as the sibling header actions (Share / Push) — !h-7 text-xs,
  // solid primary — so the whole action cluster reads as one set. Was an oversized
  // `!px-4` button with the long "Publish your Project" label, which made Publish
  // visibly taller/wider than everything beside it.
  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="max-lg:hidden !h-7 gap-1.5 px-2.5 text-xs relative"
        onClick={updateSpace}
        disabled={loading}
      >
        <MdSave className="size-3.5" />
        {loading ? "Publishing…" : "Publish"}
        {loading && <Loading className="ml-1 size-3.5 animate-spin" />}
      </Button>
      <Button
        variant="default"
        size="sm"
        className="lg:hidden !h-7 px-2.5 text-xs relative"
        onClick={updateSpace}
        disabled={loading}
      >
        {loading ? "Publishing…" : "Publish"}
        {loading && <Loading className="ml-1 size-3.5 animate-spin" />}
      </Button>
    </>
  );
}
