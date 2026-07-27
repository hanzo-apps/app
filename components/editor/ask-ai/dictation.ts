/**
 * The seam between the mic and the prompt.
 *
 * They are different things: the mic is an input DEVICE, and it lives on the
 * console bar with the other workspace controls; the prompt is a VALUE owned by
 * the composer. Rather than drill a setter down through the editor shell, the
 * composer says where a transcript lands and the mic delivers one.
 *
 * One sink at a time — there is one composer.
 */
type Sink = (text: string) => void;

let sink: Sink | null = null;

/** The composer registers where dictation lands. Returns the unregister. */
export function receiveDictation(next: Sink): () => void {
  sink = next;
  return () => {
    if (sink === next) sink = null;
  };
}

/** The mic delivers a finished transcript. No composer mounted → nothing happens. */
export function dictate(text: string): void {
  sink?.(text);
}
