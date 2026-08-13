/**
 * The model picker — what you can SEE and DO in it.
 *
 * The picker this replaced was one flat alphabetical column of raw-ish ids with
 * no marks, so these assertions are about the three things that column could
 * not do: say which family a model belongs to, show whose model it is, and let
 * you find one without reading all seventy.
 */
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ModelSelector } from "@/components/model-selector";
import { ModelIcon } from "@/components/model-icon";
import { FAMILIES, buildModelsFrom } from "@/lib/providers";

import { WithGui } from "../gui-wrapper";

const CATALOG = buildModelsFrom([
  { id: "enso", owned_by: "hanzo" },
  { id: "claude-opus-4.8", owned_by: "anthropic", context_window: 1_000_000, premium: true },
  { id: "claude-haiku-4.5", owned_by: "anthropic", context_window: 200_000 },
  { id: "gpt-4o-mini", owned_by: "openai" },
  { id: "deepseek-v4-pro", owned_by: "deepseek" },
  { id: "qwen3-coder", owned_by: "alibaba" },
  { id: "llama-4-maverick", owned_by: "meta" },
  { id: "kimi-k3", owned_by: "do-ai" },
]);

/** The inline mode renders the whole list without opening anything. */
function renderList(value?: string) {
  return render(
    <WithGui>
      <ModelSelector models={CATALOG} value={value} onChange={() => {}} mode="inline" />
    </WithGui>
  );
}

describe("the list", () => {
  it("is sectioned by family, house first", () => {
    const { container } = renderList();
    const headings = [...container.querySelectorAll('[data-slot="command-group-heading"]')]
      .map((h) => h.textContent);
    expect(headings).toEqual([
      "Enso",
      "Claude",
      "GPT",
      "Llama",
      "Qwen",
      "DeepSeek",
      "Kimi",
    ]);
  });

  it("names models the way a person writes them", () => {
    renderList();
    // Not "Gpt 4o Mini", and not "Claude Opus 4 8".
    expect(screen.getByText("GPT 4o Mini")).toBeInTheDocument();
    expect(screen.getByText("Claude Opus 4.8")).toBeInTheDocument();
    expect(screen.getByText("DeepSeek V4 Pro")).toBeInTheDocument();
  });

  it("marks every row, with no empty icon slot anywhere", () => {
    const { container } = renderList();
    const rows = [...container.querySelectorAll('[data-slot="command-item"]')];
    expect(rows).toHaveLength(CATALOG.length);
    for (const row of rows) {
      // A mark is an inline <svg>; the fallback is a monogram in a box. One of
      // the two is always present — there is no third, empty state.
      const marked = row.querySelector("svg") !== null;
      expect(marked).toBe(true);
    }
  });

  it("shows the context window when the gateway states one, and nothing when it does not", () => {
    const { container } = renderList();
    const rows = [...container.querySelectorAll<HTMLElement>('[data-slot="command-item"]')];
    const opus = rows.find((r) => r.textContent?.includes("Claude Opus 4.8"))!;
    const haiku = rows.find((r) => r.textContent?.includes("Claude Haiku 4.5"))!;
    const coder = rows.find((r) => r.textContent?.includes("Qwen 3 Coder"))!;
    expect(within(opus).getByText("1M")).toBeInTheDocument();
    expect(within(haiku).getByText("200K")).toBeInTheDocument();
    // A model with no context window must render NO node for it. `'' && …` is
    // `''`, which React renders as a text node and gui rejects outright.
    expect(coder.textContent).toBe("Qwen 3 Coder");
  });

  it("says which model is the current one", () => {
    const { container } = renderList("claude-opus-4.8");
    const rows = [...container.querySelectorAll('[data-slot="command-item"]')];
    const chosen = rows.find((r) => r.textContent?.includes("Claude Opus 4.8"))!;
    const other = rows.find((r) => r.textContent?.includes("GPT 4o Mini"))!;
    // The check is drawn on EVERY row and revealed by opacity, so the rows keep
    // one width and the column never jumps as the selection moves.
    const check = (row: Element) => {
      const svgs = [...row.querySelectorAll("svg")];
      const last = svgs[svgs.length - 1];
      return last?.getAttribute("opacity") ?? last?.style.opacity ?? "";
    };
    expect(check(chosen)).toBe("1");
    expect(check(other)).toBe("0");
  });
});

describe("the trigger", () => {
  it("names and marks the current model rather than just its id", () => {
    render(
      <WithGui>
        <ModelSelector
          models={CATALOG}
          value="claude-opus-4.8"
          onChange={() => {}}
          data-testid="picker"
        />
      </WithGui>
    );
    const trigger = screen.getByTestId("picker");
    expect(trigger).toHaveTextContent("Claude Opus 4.8");
    expect(trigger.querySelector("svg")).not.toBeNull();
  });

  it("names the empty state instead of drawing a blank control", () => {
    render(
      <WithGui>
        <ModelSelector
          models={CATALOG}
          onChange={() => {}}
          placeholder="Enso (auto-route)"
          data-testid="picker"
        />
      </WithGui>
    );
    expect(screen.getByTestId("picker")).toHaveTextContent("Enso (auto-route)");
  });
});

describe("brand marks", () => {
  it("draws something for EVERY family the catalog rules can produce", () => {
    // The guarantee is coverage, not that we own a logo for everyone: a family
    // with no mark falls to a monogram. Either way the slot is filled, so a new
    // family from the gateway can never render an empty box.
    for (const family of FAMILIES) {
      const { container, unmount } = render(
        <WithGui>
          <ModelIcon family={family.key} label={family.label} />
        </WithGui>
      );
      const drawn =
        container.querySelector("svg") !== null || (container.textContent ?? "") !== "";
      expect([family.key, drawn]).toEqual([family.key, true]);
      unmount();
    }
  });

  // This used to read "Enso CLOSED and Zen OPEN", pinning the two as a matched
  // pair of house marks — the same brush ring, one closed and one left open.
  // That pairing was the bug: Zoo Labs Foundation makes Zen, so it wears Zoo's
  // venn, the way gpt wears OpenAI's mark. Enso is still Hanzo's and unchanged.
  // What survives from the old test is the part that was always right: the two
  // may not collapse into one another, and neither may decay to a monogram.
  it("draws Enso as Hanzo's ring and Zen as Zoo's venn — two makers, two marks", () => {
    const mark = (family: string) => {
      const { container, unmount } = render(
        <WithGui>
          <ModelIcon family={family} />
        </WithGui>
      );
      const html = container.querySelector("svg")?.innerHTML ?? "";
      unmount();
      return html;
    };
    const enso = mark("enso");
    const zen = mark("zen");

    // Enso completes the circle — one full ring, no arc, no gap.
    expect(enso).toContain("<circle");
    expect(enso).not.toContain("<path");
    expect((enso.match(/<circle/g) ?? []).length).toBe(1);
    expect(enso).toContain('r="8.88"');
    expect(enso).toContain('stroke-width="2.64"');

    // Zen wears Zoo's mark: three circles for the additive primaries, the ring
    // that holds them, and the disc that cuts them back to it.
    expect((zen.match(/<circle/g) ?? []).length).toBe(5);
    expect(zen).not.toContain("<path");
    expect(zen).toContain('stroke="currentColor"');
    // Cut in user units, so the mark holds its shape at any icon size.
    expect(zen).toContain("clipPath");

    // Sharing a mark is the failure this pins: neither may fall back to the
    // other, and neither may fall back to a monogram.
    expect(zen).not.toBe(enso);
    expect(enso).not.toBe("");
    expect(zen).not.toBe("");
  });

  it("falls back to a monogram for a family it has never heard of", () => {
    const { container } = render(
      <WithGui>
        <ModelIcon family="some-new-lab" label="Some New Lab" />
      </WithGui>
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(container).toHaveTextContent("S");
  });

  it("draws a real mark, not a monogram, for the families we do own", () => {
    for (const key of ["claude", "gpt", "llama", "qwen", "deepseek", "kimi", "glm"]) {
      const { container, unmount } = render(
        <WithGui>
          <ModelIcon family={key} />
        </WithGui>
      );
      expect([key, container.querySelector("svg") !== null]).toEqual([key, true]);
      unmount();
    }
  });
});
