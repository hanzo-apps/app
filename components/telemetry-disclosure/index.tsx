'use client';

import { SizableText, Paragraph, Anchor, YStack } from '@hanzo/gui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@hanzo/ui';
import { ChevronDown } from 'lucide-react';
import { setTelemetryOptIn, track } from '@/lib/telemetry';

interface TelemetryDisclosureProps {
  open: boolean;
  onDismiss: () => void;
}

export function TelemetryDisclosure({ open, onDismiss }: TelemetryDisclosureProps) {
  const handleDisable = () => {
    setTelemetryOptIn(false);
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onDismiss(); }}>
      <DialogContent $sm={{ maxWidth: 448 }}>
        <DialogHeader>
          <DialogTitle>Anonymous Usage Analytics</DialogTitle>
          <DialogDescription>
            Hanzo App collects anonymous usage analytics to help improve the app
          </DialogDescription>
        </DialogHeader>

        <SizableText rowGap="$4" fontSize="$3" color="$color11" lineHeight={1.625} display="flex" flexDirection="column">
          <Paragraph fontSize="$3">
            Built with{' '}
            <Anchor
              href="https://github.com/o-stahl/osw-analytics"
              target="_blank"
              rel="noopener noreferrer"
              backgroundColor="$orange9" color="$orange8" paddingHorizontal="$1" paddingVertical="$0.5" borderRadius="$2" textDecorationLine="none" hoverStyle={{ color: "$orange4" }}
            >
              osw-analytics
            </Anchor>
            , an open-source approach to analytics.
          </Paragraph>

          <Collapsible>
            <YStack borderRadius="$5" backgroundColor="$color3">
              <CollapsibleTrigger alignItems="center" gap="$1.5" width="100%" padding="$3" fontSize="$1" color="$color" group hoverStyle={{ color: "$color" }}>
                <ChevronDown size={14} />
                Details
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SizableText paddingHorizontal="$4" paddingBottom="$4" rowGap="$3" fontSize="$3" color="$color11" display="flex" flexDirection="column">
                  <div>
                    <Paragraph fontWeight="500" color="$color" marginBottom="$1.5">What will <SizableText color="$orange8" textTransform="uppercase">not</SizableText> be collected:</Paragraph>
                    <YStack paddingLeft="$4.5" rowGap="$0.5">
                      <li>Your prompts or messages</li>
                      <li>Code, file names, or file contents</li>
                      <li>API keys or credentials</li>
                      <li>Inference completions</li>
                      <li>Error messages</li>
                      <li>Anything that could identify you</li>
                    </YStack>
                  </div>

                  <div>
                    <Paragraph fontWeight="500" color="$color" marginBottom="$1.5">What will be collected:</Paragraph>
                    <YStack paddingLeft="$4.5" rowGap="$0.5">
                      <li>Which views are visited (e.g. dashboard, workspace, settings)</li>
                      <li>Which AI providers and models are selected</li>
                      <li>Whether tasks succeed or fail (not what was asked)</li>
                      <li>Which tools the AI uses and whether they work</li>
                      <li>API error types (not error messages)</li>
                      <li>Session heartbeats (how long the app is open)</li>
                      <li>A randomly generated ID stored in your browser to count unique visitors</li>
                    </YStack>
                  </div>
                </SizableText>
              </CollapsibleContent>
            </YStack>
          </Collapsible>
        </SizableText>

        <DialogFooter alignItems="center" justifyContent="space-between" gap="$2" $sm={{ justifyContent: "space-between" }}>
          <Button
            type="button"
            fontSize="$1" color="$color11" textDecorationLine="underline" hoverStyle={{ color: "$color" }}
            onClick={handleDisable}
          >
            Disable analytics
          </Button>
          <Button onClick={() => { track('telemetry_accepted'); onDismiss(); }}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
