'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast, Button } from '@hanzo/ui';
import { SizableText, View } from '@hanzo/gui';
import { useParams } from "next/navigation";

import Loading from "@/components/loading";
import { api } from "@/lib/api";
import { Page } from "@/types";
import { accent } from "@/lib/chrome";
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
  // ONE Publish, sized and spaced like its sibling header actions (Share /
  // Push) so the cluster reads as one set.
  //
  // It used to be two whole buttons, one per breakpoint — and BOTH carried
  // `$lg={{ display: "none" }}`, so the breakpoint that was meant to pick one
  // picked neither: two Publish buttons below `lg`, and above it a saved
  // project had no Publish button at all. `DeployButton` (the branch taken for
  // an unsaved project) had already been through this exact bug and fixed it
  // the right way, which is what this now matches: keep one button and let the
  // breakpoint move the smallest thing that differs — the icon. The worst a
  // media-query failure can then do is show an icon on a narrow screen.
  return (
    <Button
      {...accent}
      size="sm"
      height={28} gap="$1.5" paddingHorizontal="$2.5" position="relative"
      onClick={updateSpace}
      disabled={loading}
    >
      <View $lg={{ display: "none" }}>
        <Save size={14} />
      </View>
      <SizableText fontSize="$1" color="$color12">{loading ? "Publishing…" : "Publish"}</SizableText>
      {loading && <Loading overlay={false} size={14} />}
    </Button>
  );
}
