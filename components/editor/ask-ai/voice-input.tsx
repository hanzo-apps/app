import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import classNames from "classnames";

import { Button } from "@hanzo/ui";
import { Tooltip, TooltipTrigger, TooltipContent } from "@hanzo/ui";

/**
 * Borderless dictation mic for the composer — a REAL feature, not a placeholder.
 * Uses the browser-native Web Speech API (SpeechRecognition); no backend, no
 * dependency. It transcribes a spoken phrase and hands the FINAL text back to
 * the composer via `onTranscript`, which appends it to the prompt.
 *
 * Honesty rule: if the browser has no SpeechRecognition (e.g. Firefox), the
 * button renders nothing — we never show a control that can't do its job.
 */

// Minimal shape of the vendor-prefixed Web Speech API we touch. The DOM lib
// doesn't type `webkitSpeechRecognition`, so we describe just what we use.
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionResultEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceInput({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const start = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang =
      typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
      }
      const text = finalText.trim();
      if (text) onTranscript(text);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  if (!supported) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="iconXs"
          variant="ghost"
          disabled={disabled}
          aria-pressed={listening}
          aria-label={listening ? "Stop dictation" : "Dictate with your voice"}
          onClick={() => (listening ? stop() : start())}
          className={classNames(
            "rounded-full text-muted-foreground hover:bg-accent hover:text-foreground",
            listening && "!text-foreground"
          )}
        >
          <Mic
            className={classNames(
              "size-4",
              listening && "animate-pulse motion-reduce:animate-none"
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        align="end"
        className="-translate-y-0.5 rounded-md bg-card px-2 py-1 text-xs text-foreground"
      >
        {listening ? "Listening… tap to stop" : "Dictate with your voice"}
      </TooltipContent>
    </Tooltip>
  );
}
