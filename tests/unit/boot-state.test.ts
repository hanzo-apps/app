
import { read, root, stripComments } from "../source";

const editor = read("components/editor/index.tsx");
const header = read("components/editor/header/index.tsx");

/**
 * A fresh project boots as CONVERSATION alone.
 *
 * The reference (and plain sense): before the first real content exists there
 * is nothing to preview, no pages to browse, no panes to switch — chrome for a
 * missing thing reads as a broken thing. So the preview card, the resizer, the
 * pane pills and the page tooling are all gated on the same predicate, and the
 * unfurl is that predicate flipping when the first bytes stream into `pages`.
 *
 * Pinned at source level because the failure is silent in both directions: a
 * dropped gate boots every new project into an empty preview card (the state
 * this replaces), and a stuck gate strands a BUILT project in chat-only.
 */
describe("boot: conversation first", () => {
  it("freshness is derived from the scaffold, not from a flag", () => {
    // A stored boolean would go stale — restored projects, plan-mode turns and
    // mid-stream generation all have to agree, and the content itself is the
    // one thing they cannot disagree about.
    expect(editor).toMatch(/const fresh = pages\.length <= 1 && isTheSameHtml\(/);
  });

  it("boot ignores a collapsed sidebar — the conversation IS the window", () => {
    expect(editor).toMatch(/!fresh && sidebarCollapsed \? "none" : "flex"/);
  });

  it("the preview hides by display, so the iframe stays warm for the unfurl", () => {
    expect(editor).toMatch(/display: fresh \? "none" : "flex"/);
    // Unmounting would cold-start the iframe at the exact moment the first
    // build lands — the one moment the preview must paint instantly.
    expect(editor).not.toMatch(/\{!fresh && \(\s*<Preview/);
  });

  it("the resizer only exists between two panes", () => {
    expect(editor).toMatch(/\$lg=\{\{ display: fresh \? "none" : "flex" \}\} group\b/);
  });

  it("the resizer declares its group as a PROP, so the hairline has a rule", () => {
    // Tailwind's className spelling registers nothing in gui: the hairline
    // carried the atomic class and the sheet carried no rule of that name, so
    // the splitter was transparent at rest AND under the pointer — the one
    // affordance between the panes did not exist, and nothing errored.
    // Comment-stripped, so the note above cannot satisfy its own check.
    const code = stripComments(editor);
    expect(code).not.toMatch(/className="group\//);
    expect(code).toMatch(/\$group-hover=\{\{ backgroundColor: "\$color06" \}\}/);
  });

  it("the chat column narrows to the composer's own reading measure in boot", () => {
    // 672, not 860: it must match the composer's maxWidth (ask-ai root) or the
    // thread runs wider than the box beneath it and messages read as blobs.
    expect(editor).toMatch(/maxWidth: 600, alignSelf: "center"/);
  });

  it("the header receives the same fact, spelled once", () => {
    expect(editor).toMatch(/booted=\{!fresh\}/);
  });
});

describe("boot: the header is minimal", () => {
  it("the pane pills wait for a workspace", () => {
    expect(header).toMatch(/\{booted && \(\s*<XStack\s+role="tablist"/);
  });

  it("the centre tooling waits too, but the middle still grows", () => {
    // Without the spacer the right cluster would slide into the middle of the
    // bar the moment the centre cluster vanished.
    expect(header).toMatch(/\{!booted \? \(/);
    expect(header).toMatch(/<XStack flexGrow=\{1\} flexShrink=\{1\} flexBasis="auto" minWidth=\{0\} \/>/);
  });

  it("booted defaults to true so every other mount keeps its chrome", () => {
    expect(header).toMatch(/booted = true/);
  });
});

describe("the trough always names the open pane", () => {
  it("desktop boots on preview — chat is a tab only where chat is a tab", () => {
    // currentTab starts "chat" for mobile-first, but chat's segment is hidden
    // above lg — so the bar highlighted NOTHING while the preview plainly
    // showed. The two sites that could recreate the dead-bar state are pinned:
    // the mount effect and the element-click flip.
    expect(editor).toMatch(/setCurrentTab\(\(t\) => \(t === "chat" \? "preview" : t\)\)/);
    expect(editor).toMatch(/window\.innerWidth < 1024[\s\S]{0,120}setCurrentTab\("chat"\)/);
  });
});
