'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast, Button } from '@hanzo/ui';
import { useParams } from "next/navigation";

import Loading from "@/components/loading";
import { api } from "@/lib/api";
import { Page } from "@/types";
import { Save } from "lucide-react";

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
        height={28} gap="$1.5" paddingHorizontal="$2.5" fontSize="$1" position="relative" $lg={{ display: "none" }}
        onClick={updateSpace}
        disabled={loading}
      >
        <Save size={14} />
        {loading ? "Publishing…" : "Publish"}
        {loading && <Loading overlay={false} size={14} />}
      </Button>
      <Button
        variant="default"
        size="sm"
        height={28} paddingHorizontal="$2.5" fontSize="$1" position="relative" $lg={{ display: "none" }}
        onClick={updateSpace}
        disabled={loading}
      >
        {loading ? "Publishing…" : "Publish"}
        {loading && <Loading overlay={false} size={14} />}
      </Button>
    </>
  );
}
