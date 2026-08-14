'use client';

/**
 * The API quickstart — ONE request, four clients.
 *
 * The landing's models strip and /docs both used to hand-inline the same six
 * lines of pseudo-HTTP. Two copies of one sentence about our own API is two
 * places for it to go stale, and it HAD: both named `zen5` (Zen is Zoo Labs
 * Foundation's family, not ours) and both spelled the key `$HANZO_KEY`, a
 * variable that exists nowhere else in this repo. This is the one copy.
 *
 * WHAT IS REAL HERE, because a quickstart that does not run is worse than none:
 *
 * - `api.hanzo.ai/v1/chat/completions` is the live gateway endpoint.
 * - `enso` is a real routable id — `GET /v1/models` returns it as
 *   `{"id":"enso","owned_by":"hanzo","premium":true,"context_window":1000000}`,
 *   beside `enso-flash` and `enso-ultra`. Enso is the family Hanzo builds, so
 *   Hanzo's own quickstart shows it. `tests/unit/zen-is-zoos-not-hanzos.test.ts`
 *   states the other half of that rule.
 * - `HANZO_API_KEY` is the name the rest of this repo already uses for a
 *   gateway key (`lib/agent/harness.ts`, `lib/vfs/templates/registry.ts`).
 * - The TypeScript and Python tabs use the `openai` clients pointed at our
 *   baseURL because that IS the claim the section makes — OpenAI-compatible,
 *   one line changed. Go talks to it over net/http, which needs no SDK.
 *
 * COLOUR. There is none, by construction: `assets/globals.css` states that this
 * product has no accent hue and that its accent IS the brightest neutral. So the
 * four token classes are separated by BRIGHTNESS and WEIGHT on gui's own
 * greyscale ramp — measured `hsla(0,0%,{100,80,67,52}%)` — and never by hue. A
 * rainbow palette would be the one thing on the page with a colour in it.
 *
 * NO HIGHLIGHTER DEPENDENCY. Production blocks third-party CDNs (see
 * `tests/unit/vendor.test.ts`), and four static samples do not justify shipping
 * a runtime grammar engine. `scan()` below is the whole thing.
 */

import { useState } from 'react';
import { Button, SizableText, Tabs, TabsContent, TabsList, TabsTrigger, XStack, YStack } from '@hanzo/ui';
import { Check, Copy } from 'lucide-react';

import { ModelIcon } from './model-icon';

/** The live gateway. Every sample below posts here and nowhere else. */
export const ENDPOINT = 'https://api.hanzo.ai/v1/chat/completions';

/** Hanzo's own house model. Verified against the live catalog — see the note above. */
export const MODEL = 'enso';

/** The environment variable the rest of this repo already reads a key from. */
const KEY = 'HANZO_API_KEY';

/** One prompt across every tab, so the four samples are visibly the same call. */
const ASK = 'Explain the Fermi paradox.';

type Sample = {
  /** Tab label, and the value the strip switches on. */
  name: string;
  /** How this language opens a comment — the only per-language rule `scan` needs. */
  note: '#' | '//';
  code: string;
};

const SAMPLES: Sample[] = [
  {
    name: 'curl',
    note: '#',
    code: `curl ${ENDPOINT} \\
  -H "Authorization: Bearer $${KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${MODEL}",
    "messages": [{ "role": "user", "content": "${ASK}" }]
  }'`,
  },
  {
    name: 'TypeScript',
    note: '//',
    code: `import OpenAI from "openai";

const hanzo = new OpenAI({
  baseURL: "https://api.hanzo.ai/v1",
  apiKey: process.env.${KEY},
});

const res = await hanzo.chat.completions.create({
  model: "${MODEL}",
  messages: [{ role: "user", content: "${ASK}" }],
});

console.log(res.choices[0].message.content);`,
  },
  {
    name: 'Python',
    note: '#',
    code: `import os
from openai import OpenAI

hanzo = OpenAI(
    base_url="https://api.hanzo.ai/v1",
    api_key=os.environ["${KEY}"],
)

res = hanzo.chat.completions.create(
    model="${MODEL}",
    messages=[{"role": "user", "content": "${ASK}"}],
)

print(res.choices[0].message.content)`,
  },
  {
    name: 'Go',
    note: '//',
    code: `package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

func main() {
	payload := strings.NewReader(\`{
		"model": "${MODEL}",
		"messages": [{"role": "user", "content": "${ASK}"}]
	}\`)

	req, err := http.NewRequest("POST", "${ENDPOINT}", payload)
	if err != nil {
		log.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+os.Getenv("${KEY}"))
	req.Header.Set("Content-Type", "application/json")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	defer res.Body.Close()

	io.Copy(os.Stdout, res.Body)
}`,
  },
];

/**
 * What a run of source is. Four classes is enough to read code by, and four is
 * all a hueless palette has room to separate.
 */
type Kind = 'plain' | 'key' | 'value' | 'punct' | 'note';

/**
 * The ramp, top to bottom: the DATA is brightest because it is what the panel
 * exists to show (the endpoint, the model id, the prompt), structure is dimmest
 * because it is the part you already know. `--color*` are gui's own theme
 * variables, so this tracks the theme rather than restating it in hex.
 */
const INK: Record<Kind, React.CSSProperties> = {
  value: { color: 'var(--color)' },
  key: { color: 'var(--color11)', fontWeight: 500 },
  plain: { color: 'var(--color11)' },
  note: { color: 'var(--color10)', fontStyle: 'italic' },
  punct: { color: 'var(--color9)' },
};

const PUNCT = new Set('{}[]()<>,;:=+-*&|!?.\\/'.split(''));

/** True when the next glyph assigns — a `:` that is not Go's `:=`. */
function assigns(code: string, from: number): boolean {
  let j = from;
  while (code[j] === ' ' || code[j] === '\t') j++;
  return code[j] === ':' && code[j + 1] !== '=';
}

/**
 * Source in, styled runs out. Adjacent runs of one kind are merged, so a line of
 * plain text costs one span rather than one per character.
 *
 * A quoted region is ONE value even when it holds JSON — which is what the
 * shell and Go's raw literals actually mean, and it puts the whole request body
 * on the brightest rung, where the eye wants it.
 */
export function scan(code: string, note: '#' | '//'): Array<[Kind, string]> {
  const out: Array<[Kind, string]> = [];
  const push = (kind: Kind, text: string) => {
    const last = out[out.length - 1];
    if (last && last[0] === kind) last[1] += text;
    else out.push([kind, text]);
  };

  for (let i = 0; i < code.length; ) {
    const rest = code.slice(i);
    const c = code[i];

    // A comment runs to the end of its line.
    if (rest.startsWith(note)) {
      const end = code.indexOf('\n', i);
      const stop = end < 0 ? code.length : end;
      push('note', code.slice(i, stop));
      i = stop;
      continue;
    }

    // A bare URL is one value. Left to the rules below, `https://api.hanzo.ai`
    // comes apart into three punctuation marks and four words.
    const url = /^https?:\/\/[^\s"'`,)]*/.exec(rest);
    if (url) {
      push('value', url[0]);
      i += url[0].length;
      continue;
    }

    // A quoted run, escapes included, closed by its own quote.
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < code.length && code[j] !== c) j += code[j] === '\\' ? 2 : 1;
      j = Math.min(j + 1, code.length);
      push(assigns(code, j) ? 'key' : 'value', code.slice(i, j));
      i = j;
      continue;
    }

    const word = /^[A-Za-z_$][\w$]*/.exec(rest);
    if (word) {
      push(assigns(code, i + word[0].length) ? 'key' : 'plain', word[0]);
      i += word[0].length;
      continue;
    }

    const num = /^\d[\d_.]*/.exec(rest);
    if (num) {
      push('value', num[0]);
      i += num[0].length;
      continue;
    }

    push(PUNCT.has(c) ? 'punct' : 'plain', c);
    i += 1;
  }

  return out;
}

/**
 * The rendered code. Plain spans inside one gui text node: they inherit the
 * mono family, the size and `white-space: pre` from it, so the only thing each
 * span states is the one thing that differs.
 */
function Code({ sample }: { sample: Sample }) {
  return (
    <SizableText
      fontFamily="$mono"
      fontSize="$1"
      lineHeight="1.7"
      color="$color11"
      whiteSpace="pre"
      overflow="scroll"
      display="block"
      // The Go sample is indented with real tabs, because that is what gofmt
      // writes and what you want on the clipboard. A tab defaults to EIGHT
      // columns, which pushed its body a third of the way across the card.
      style={{ tabSize: 2 }}
    >
      {scan(sample.code, sample.note).map(([kind, text], i) => (
        <span key={i} style={INK[kind]}>
          {text}
        </span>
      ))}
    </SizableText>
  );
}

/** Copies this tab's source, and says so for ~1.5s. */
function CopyCode({ code }: { code: string }) {
  const [done, setDone] = useState(false);

  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label="Copy code"
      title="Copy code"
      height="$5"
      width="$5"
      flexShrink={0}
      alignItems="center"
      justifyContent="center"
      borderRadius="$3"
      {...{ color: done ? '$color' : '$color11' }}
      onClick={() => {
        // The panel is decoration if the clipboard refuses; it must not throw.
        void navigator.clipboard?.writeText(code).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          },
          () => {},
        );
      }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
    </Button>
  );
}

/**
 * The panel. Layout is the caller's — it renders a card and fills the width it
 * is given, so both consumers wrap it in their own `Reveal` for placement and
 * entrance, the same way every other landing block is positioned.
 */
export function Quickstart() {
  const [tab, setTab] = useState(SAMPLES[0].name);
  const shown = SAMPLES.find((s) => s.name === tab) ?? SAMPLES[0];

  return (
    <YStack
      width="100%"
      borderRadius="$6"
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$color2"
      overflow="hidden"
    >
      {/* Chrome: the request, stated once, above every client that makes it. */}
      <XStack
        alignItems="center"
        gap="$3"
        flexWrap="wrap"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        <XStack alignItems="center" gap="$1.5" flexShrink={0}>
          <SizableText height={10} width={10} borderRadius="$10" backgroundColor="$color4" />
          <SizableText height={10} width={10} borderRadius="$10" backgroundColor="$color4" />
          <SizableText height={10} width={10} borderRadius="$10" backgroundColor="$color4" />
        </XStack>

        <XStack alignItems="center" gap="$2" flexShrink={1} minWidth={0}>
          <SizableText
            fontFamily="$mono"
            fontSize="$1"
            fontWeight="500"
            color="$color"
            flexShrink={0}
          >
            POST
          </SizableText>
          <SizableText fontFamily="$mono" fontSize="$1" color="$color11" numberOfLines={1}>
            api.hanzo.ai/v1/chat/completions
          </SizableText>
        </XStack>

        {/* The model this calls, wearing its own mark. `ModelIcon` is the ONE
            path to @hanzo/logo's ENSO_MARK — the CLOSED ring — so the glyph
            here and the glyph in the model picker cannot drift apart. */}
        <XStack
          alignItems="center"
          gap="$2"
          marginLeft="auto"
          flexShrink={0}
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$10"
          paddingHorizontal="$2.5"
          paddingVertical="$1.5"
        >
          <ModelIcon family="enso" size={14} />
          <SizableText fontFamily="$mono" fontSize="$1" color="$color">
            {MODEL}
          </SizableText>
        </XStack>
      </XStack>

      <Tabs value={tab} onValueChange={setTab}>
        <XStack
          alignItems="center"
          gap="$2"
          paddingHorizontal="$3"
          paddingVertical="$2"
          borderBottomWidth={1}
          borderColor="$borderColor"
        >
          <TabsList flexShrink={1} minWidth={0} backgroundColor="transparent">
            {/* A trigger is a Stack, not a text primitive — type comes from the
                label inside it, never from a font prop on the tab.

                `.hz-tap` is the existing marker for "a standalone tap target",
                and these are the panel's only control. Measured on a phone
                without it: 30px painted, 38px reachable (@hanzo/ui's own
                `data-touch-y` adds 4px a side), against a 44px floor. The floor
                rule in globals.css names `button`, `[role="button"]` and
                `a[href]` — a tab is none of those. Marking the component is the
                fix; widening that rule to `[role="tab"]` would also seize the
                builder's two hand-rolled segmented controls, which is the trap
                the landing CLAUDE.md records under "a role is not a component". */}
            {SAMPLES.map((s) => (
              <TabsTrigger key={s.name} value={s.name} className="hz-tap">
                <SizableText fontFamily="$mono" fontSize="$1" color="inherit">
                  {s.name}
                </SizableText>
              </TabsTrigger>
            ))}
          </TabsList>
          <XStack marginLeft="auto" flexShrink={0}>
            <CopyCode code={shown.code} />
          </XStack>
        </XStack>

        {/* The pane is as tall as its code, and capped. A fixed height was tried
            first and is wrong: Go needs 28 lines where curl needs 7, so every
            box tall enough for Go opened the panel on 200px of empty black under
            the curl sample — the default tab, and the one most people see. The
            cap is what Go scrolls inside instead. */}
        {SAMPLES.map((s) => (
          <TabsContent key={s.name} value={s.name} padding="$4" maxHeight={440} overflow="scroll">
            <Code sample={s} />
          </TabsContent>
        ))}
      </Tabs>
    </YStack>
  );
}

export default Quickstart;
