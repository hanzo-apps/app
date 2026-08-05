'use client';

import { YStack } from '@hanzo/gui';

import { Spinner } from '@/components/ui/spinner';

/**
 * A spinner centred on a dark overlay — the preview/save surfaces, where what is
 * being covered is still on screen behind it.
 *
 * The SPINNER is `components/ui/spinner`, the one home; this owns only the
 * overlay. It used to reach for `@hanzo/gui`'s `Spinner` itself, which made it
 * the app's SECOND spinner: gui's is react-native's `ActivityIndicator` — a
 * faint full ring under a dashed arc — while every other loading state in the
 * app is lucide's three-quarter arc. Both shipped, sometimes on one screen.
 *
 * It was also the wrong SIZE. gui types that `size` as `'small' | 'large'`, so
 * it cannot take pixels; this passed `width`/`height` to the wrapping stack
 * instead, which sized the BOX and left the indicator at its own preset. Every
 * `<Loading overlay={false} size={12|14|16} />` in the app drew an indicator
 * that ignored the number beside it.
 */
function Loading({
  overlay = true,
  size = 20,
}: {
  overlay?: boolean;
  /** Spinner box in px. */
  size?: number;
}) {
  const spinner = <Spinner size={size} />;
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
