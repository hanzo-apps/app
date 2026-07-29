'use client';

/**
 * Remix progress — the animated "Remixing project" modal.
 *
 * Three steps, each tied to REAL work (never a fake timer standing in for a
 * network call):
 *   ① Creating project        → createRemixProject  (POST /v1/projects)
 *   ② Setting up integrations → provisionRemixProject(POST /v1/provision:
 *                               enables Hanzo Base + Analytics); the sub-line
 *                               cycles the pieces being enabled.
 *   ③ Finalizing              → seedRemix (write the remixSetup handoff) → /dev
 *
 * Each step animates pending (grey dot) → active (spinner) → done (green check).
 * Under prefers-reduced-motion the steps still advance but resolve instantly with
 * no spinners and no artificial padding. The modal is non-dismissible while it
 * runs; the pipeline always resolves (its steps fall back rather than throw), so
 * the user is never stranded.
 */

import { SizableText, H2, Paragraph, YStack, XStack } from '@hanzo/gui';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@hanzo/ui';
import { Check, Loader2, Circle } from 'lucide-react';
import { HanzoLogo } from '@/components/HanzoLogo';
import {
  createRemixProject,
  provisionRemixProject,
  remixFirstMessage,
  seedRemix,
} from '@/lib/remix';

type StepState = 'pending' | 'active' | 'done';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

const SUBLINES = ['Enabling Hanzo Base', 'Enabling Analytics', 'Finalizing code management'];

export function RemixProgress({
  open,
  projectName,
  templateSlug,
  onOpenChange,
}: {
  open: boolean;
  projectName: string;
  templateSlug: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [s1, setS1] = useState<StepState>('pending');
  const [s2, setS2] = useState<StepState>('pending');
  const [s3, setS3] = useState<StepState>('pending');
  const [subline, setSubline] = useState(SUBLINES[0]);
  const startedRef = useRef(false);

  // Reset when closed so a subsequent remix runs fresh.
  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      setS1('pending');
      setS2('pending');
      setS3('pending');
      setSubline(SUBLINES[0]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || startedRef.current) return;
    startedRef.current = true;
    const reduced = prefersReducedMotion();
    let sublineTimer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    (async () => {
      try {
        // ① Creating project
        setS1('active');
        const [{ slug }] = await Promise.all([
          createRemixProject(projectName),
          wait(reduced ? 0 : 700),
        ]);
        if (cancelled) return;
        setS1('done');

        // ② Setting up integrations (Base + Analytics)
        setS2('active');
        if (!reduced) {
          let i = 0;
          sublineTimer = setInterval(() => {
            i = (i + 1) % SUBLINES.length;
            setSubline(SUBLINES[i]);
          }, 900);
        }
        const [prov] = await Promise.all([
          provisionRemixProject(slug),
          wait(reduced ? 0 : 1400),
        ]);
        if (sublineTimer) clearInterval(sublineTimer);
        if (cancelled) return;
        setS2('done');

        // ③ Finalizing — write the builder handoff + navigate
        setS3('active');
        const firstMessage = remixFirstMessage(projectName, prov);
        const url = seedRemix(
          { projectId: slug, firstMessage, provisioned: prov.provisioned, pending: prov.pending },
          templateSlug,
        );
        await wait(reduced ? 0 : 500);
        if (cancelled) return;
        setS3('done');
        await wait(reduced ? 0 : 350);
        router.push(url);
      } catch {
        // Never strand the user: fall back to the plain template-edit path.
        if (sublineTimer) clearInterval(sublineTimer);
        if (!cancelled) {
          router.push(`/dev?template=hanzo-apps/${templateSlug}&action=edit&remixed=true`);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (sublineTimer) clearInterval(sublineTimer);
    };
  }, [open, projectName, templateSlug, router]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        maxWidth={384} borderColor="$borderColor" backgroundColor="$background" color="$color"
      >
        <DialogTitle position="absolute" width={1} height={1} overflow="hidden">Remixing project</DialogTitle>

        <SizableText flexDirection="column" alignItems="center" paddingBottom="$1" paddingTop="$2" textAlign="center" display="flex">
          <HanzoLogo animated className="mb-3 h-8 w-8 text-foreground" />
          <H2 fontSize="$4" fontWeight="500">Remixing project</H2>
          <Paragraph marginTop="$1" fontSize="$1" color="$color11">This may take a few moments.</Paragraph>
        </SizableText>

        <YStack marginTop="$3" rowGap="$3">
          <Step state={s1} label="Creating project" />
          <Step state={s2} label="Setting up integrations" subline={s2 === 'active' ? subline : undefined} />
          <Step state={s3} label="Finalizing" />
        </YStack>
      </DialogContent>
    </Dialog>
  );
}

function Step({ state, label, subline }: { state: StepState; label: string; subline?: string }) {
  return (
    <XStack alignItems="flex-start" gap="$3">
      <SizableText marginTop="$0.5" height="$4.5" width="$4.5" alignItems="center" justifyContent="center">
        {state === 'done' ? (
          <Check size={16} color="$green8" />
        ) : state === 'active' ? (
          <Loader2 size={16} color="$color" />
        ) : (
          <Circle size={10} color="$color11" />
        )}
      </SizableText>
      <YStack minWidth={0}>
        <Paragraph {...{ fontSize: state === 'pending' ? "$3" : "$3", color: state === 'pending' ? "$color11" : "$color" }}>{label}</Paragraph>
        {subline && <Paragraph marginTop="$0.5" fontSize="$1" color="$color11">{subline}</Paragraph>}
      </YStack>
    </XStack>
  );
}

export default RemixProgress;
