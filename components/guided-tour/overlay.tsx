'use client';

import { YStack, XStack, H3, SizableText } from '@hanzo/ui';
import { glass } from "@/lib/chrome";
import { useEffect, useMemo, useState } from 'react';
import { useGuidedTour } from './context';
import { Button } from '@hanzo/ui';
import { GUIDED_TOUR_STEPS } from './steps';
import { Spinner } from '@/components/ui/spinner';

interface GuidedTourOverlayProps {
  location: 'global' | 'project-manager' | 'workspace' | 'settings';
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function GuidedTourOverlay({ location }: GuidedTourOverlayProps) {
  const { state, next, previous, skip } = useGuidedTour();
  const { status, currentStep, stepKey, isBusy, stepIndex } = state;
  const [rect, setRect] = useState<HighlightRect | null>(null);
  
  const totalSteps = GUIDED_TOUR_STEPS.length;
  const currentStepNumber = stepIndex + 1;

  useEffect(() => {
    if (status !== 'running') return;
    if (!currentStep) return;
    if (currentStep.location !== location) return;
    if (!currentStep.target) {
      setRect(null);
      return;
    }

    let cancelled = false;
    const selector = currentStep.target;

    const updateRect = () => {
      if (cancelled) return;
      // Find all matching elements
      const elements = document.querySelectorAll(selector);
      let visibleEl: HTMLElement | null = null;
      
      // Find the first visible element
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        // Check if element is visible (has dimensions)
        if (el.offsetWidth > 0 && el.offsetHeight > 0) {
          visibleEl = el;
          break;
        }
      }
      
      if (visibleEl) {
        const bounds = visibleEl.getBoundingClientRect();
        setRect({
          top: bounds.top,
          left: bounds.left,
          width: bounds.width,
          height: bounds.height,
        });
        return true;
      }
      setRect(null);
      return false;
    };

    updateRect();
    const interval = window.setInterval(() => {
      if (updateRect()) {
        window.clearInterval(interval);
      }
    }, 250);
    window.addEventListener('resize', updateRect);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('resize', updateRect);
    };
  }, [status, currentStep, location, stepKey]);

  const disableNext = useMemo(() => {
    if (!currentStep) return false;
    if (!isBusy) return false;
    return currentStep.id === 'workspace-edit' || currentStep.id === 'workspace-focus' || currentStep.id === 'workspace-checkpoint';
  }, [currentStep, isBusy]);

  if (status !== 'running' || !currentStep || currentStep.location !== location) {
    return null;
  }

  const primaryLabel = currentStep.primaryLabel ?? 'Next';
  const secondaryLabel = currentStep.secondaryLabel ?? 'Skip';
  return (
    <YStack position="fixed" top={0} right={0} bottom={0} left={0} zIndex={2000} pointerEvents="auto">
      <YStack position="absolute" top={0} right={0} bottom={0} left={0} backgroundColor="$background" opacity={0.8} />
      {rect && (
        <YStack
          pointerEvents="none" position="fixed" borderRadius="$6" borderWidth={2} borderColor="$color12"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
  />
      )}

      <YStack position="absolute" bottom="$7" left="50%" width="100%" maxWidth={576} x="-50%" gap="$4" paddingHorizontal="$4">
        <YStack {...glass(3)} pointerEvents="auto" borderRadius="$8" borderWidth={1} padding="$5">
          <XStack alignItems="flex-start" justifyContent="space-between" gap="$4">
            <YStack flex={1}>
              <XStack alignItems="center" justifyContent="space-between" gap="$4">
                <H3 fontSize="$6" fontWeight="500" color="$color">{currentStep.title}</H3>
                <SizableText fontSize="$3" color="$color11" fontWeight="500">{currentStepNumber}/{totalSteps}</SizableText>
              </XStack>
              <YStack marginTop="$2">
                <SizableText fontSize="$3" lineHeight="1.625" color="$color11">
                  {currentStep.body}
                </SizableText>
              </YStack>
            </YStack>
            {isBusy && (
              <Spinner size={20} />
            )}
          </XStack>

          <XStack marginTop="$5" alignItems="center" justifyContent="space-between">
            {currentStep.showBack ? (
              <Button variant="ghost" onClick={previous} disabled={isBusy}>
                Back
              </Button>
            ) : (
              <div />
            )}
            <XStack alignItems="center" gap="$2">
              <Button variant="ghost" onClick={skip}>
                {secondaryLabel}
              </Button>
              <Button onClick={next} disabled={disableNext}>
                {primaryLabel}
              </Button>
            </XStack>
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  );
}
