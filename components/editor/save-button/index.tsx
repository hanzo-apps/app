'use client';

/**
 * Publish a saved project — one button over the ONE write path.
 *
 * It used to `PUT /me/projects/${namespace}/${repoId}` with both segments read
 * from `useParams`. This button only ever renders inside the builder, whose
 * route is `/dev/[org]/[project]`, so those two names matched no param and the
 * request went to `/v1/me/projects/undefined/undefined` — a 404 every time, and
 * the toast that followed offered a "See Space" link built from the same two
 * undefineds. The path it aimed at is also the HuggingFace-backed one that no
 * longer holds anything.
 *
 * So it does not address the project itself any more. It asks autosave to flush,
 * which commits to the project's repo on git.hanzo.ai and is the same write the
 * status bar reports — one path, one place to fix, and the button can no longer
 * disagree with the bar beside it.
 */
import { useState } from "react";
import { toast, Button } from '@hanzo/ui';
import { SizableText, View } from '@hanzo/ui';

import Loading from "@/components/loading";
import { accent } from "@/lib/chrome";
import { Save } from "lucide-react";

export function SaveButton({ save }: { save: () => Promise<boolean> }) {
  const [loading, setLoading] = useState(false);

  const publish = async () => {
    setLoading(true);
    try {
      // Never claim it landed unless it did — the same rule the status bar keeps.
      if (await save()) toast.success("Saved to your project's history.");
      else toast.error("Could not save. Your work is still here — retrying.");
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
      height={28} gap="$1.5" paddingHorizontal="$3" borderRadius={999} position="relative"
      onClick={publish}
      disabled={loading}
    >
      <View $lg={{ display: "none" }}>
        <Save size={14} />
      </View>
      <SizableText fontSize="$1" color="$color12">{loading ? "Saving…" : "Publish"}</SizableText>
      {loading && <Loading overlay={false} size={14} />}
    </Button>
  );
}
