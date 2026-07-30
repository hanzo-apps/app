'use client';

import { Spinner, YStack } from '@hanzo/gui';

/** The ONE loading indicator: gui's Spinner, optionally centered on a dark
 *  overlay (the preview/save surfaces) or inline beside a label. */
function Loading({
  overlay = true,
  size = 20,
}: {
  overlay?: boolean;
  /** Spinner box in px. */
  size?: number;
}) {
  const spinner = <Spinner width={size} height={size} color="$color" />;
  if (!overlay) return spinner;
  return (
    <YStack
      position="absolute" left="$0" top="$0" height="100%" width="100%"
      alignItems="center" justifyContent="center" zIndex={20}
      backgroundColor="black" borderRadius="$10"
    >
      {spinner}
    </YStack>
  );
}

export default Loading;
