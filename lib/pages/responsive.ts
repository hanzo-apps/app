/**
 * Find the things in a generated site that CANNOT render correctly on a phone.
 *
 * "Responsive on any screen" is asked for in the prompt. This is the half that
 * checks it — but only for failures that are decidable from the markup itself.
 * Real layout needs a browser, so anything requiring measurement is deliberately
 * out of scope: a checker that reports maybes trains people to ignore it, and
 * then it is ignored on the day it is right.
 *
 * Three failures qualify, because each is certain from the source alone:
 *
 *   1. NO VIEWPORT META. Without it a phone renders at ~980px and scales down,
 *      so every layout is wrong no matter how good the CSS is. This is the one
 *      that makes a site look broken on mobile while looking perfect in the
 *      desktop preview — which is exactly the gap the builder's preview leaves.
 *   2. A FIXED WIDTH WIDER THAN A PHONE. `width: 1200px` cannot fit 390px, and
 *      no media query below it can rescue an element that declares it
 *      unconditionally.
 *   3. A MIN-WIDTH WIDER THAN A PHONE. Same, and worse: min-width forces the
 *      body to scroll sideways rather than merely clipping.
 *
 * Percentages, `vw`, `max-width`, `rem` and anything inside a media query are
 * all fine and are not reported.
 */

/** The narrow width the builder's own deploy gate renders at. */
export const PHONE_PX = 390;

export interface ResponsiveIssue {
  from: string;
  /** What is wrong, phrased for the person who has to fix it. */
  problem: string;
  /** The offending source, trimmed — so the message can point at it. */
  detail?: string;
}

/** Strip the contents of every `@media` block: those rules are conditional. */
function withoutMediaQueries(css: string): string {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf("@media", i);
    if (at === -1) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, at);
    // Walk to the matching close brace of the media block.
    const open = css.indexOf("{", at);
    if (open === -1) break;
    let depth = 0;
    let j = open;
    for (; j < css.length; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    i = j + 1;
  }
  return out;
}

/** All `<style>` bodies plus every inline `style="…"`, minus media queries. */
function unconditionalCss(html: string): string {
  let css = "";
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) css += m[1] + "\n";
  css = withoutMediaQueries(css);
  for (const m of html.matchAll(/\bstyle\s*=\s*["']([^"']+)["']/gi)) css += m[1] + ";\n";
  return css;
}

/** `width: 1200px` → 1200. Ignores %, vw, rem, auto, calc. */
function pxWidths(css: string, prop: "width" | "min-width"): number[] {
  const re = new RegExp(`(?:^|[;{\\s])${prop}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`, "gi");
  return [...css.matchAll(re)].map((m) => Number(m[1])).filter((n) => Number.isFinite(n));
}

/** Everything in `pages` that cannot render correctly at {@link PHONE_PX}. */
export function responsiveIssues(
  pages: { path: string; html: string }[],
): ResponsiveIssue[] {
  const out: ResponsiveIssue[] = [];

  for (const page of pages) {
    const html = page.html ?? "";
    // Only judge documents. A fragment has no <head> to carry a viewport tag.
    if (/<html[\s>]/i.test(html) && !/<meta[^>]+name\s*=\s*["']viewport["']/i.test(html)) {
      out.push({
        from: page.path,
        problem:
          "no viewport meta — a phone renders this at ~980px and scales it down, so every layout is wrong",
      });
    }

    const css = unconditionalCss(html);
    const tooWide = pxWidths(css, "width").filter((n) => n > PHONE_PX);
    if (tooWide.length) {
      out.push({
        from: page.path,
        problem: `a fixed width wider than a ${PHONE_PX}px phone`,
        detail: `width: ${Math.max(...tooWide)}px`,
      });
    }
    const minTooWide = pxWidths(css, "min-width").filter((n) => n > PHONE_PX);
    if (minTooWide.length) {
      out.push({
        from: page.path,
        problem: `a min-width wider than a ${PHONE_PX}px phone — this forces sideways scrolling`,
        detail: `min-width: ${Math.max(...minTooWide)}px`,
      });
    }
  }
  return out;
}
