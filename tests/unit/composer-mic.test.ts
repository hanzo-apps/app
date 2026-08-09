import { readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "../..");
const askAi = readFileSync(join(root, "components/editor/ask-ai/index.tsx"), "utf8");
const consoleSrc = readFileSync(join(root, "components/editor/console/index.tsx"), "utf8");

/**
 * The mic lives in the composer's action row, once.
 *
 * It lived on the console bar, fed through a seam (ask-ai/mic.ts) because the
 * composer owned the machine and the bar drew it. When the console's rest
 * state became an invisible edge, the mic became a voice feature nobody could
 * see — the owner's words: "add our mic in too, we have voice chat". The seam
 * is deleted; the machine and its control are one component again, in the
 * reference's own row order: Build ⌄ · mic · send.
 */
describe("the composer mic", () => {
  it("renders in the composer, from the machine the composer owns", () => {
    expect(askAi).toMatch(/<Voice voice=\{voice\} disabled=\{isAiWorking\}/);
    expect(askAi).toMatch(/useVoice\(\{/);
  });

  it("the console does not draw it — the seam is gone", () => {
    expect(consoleSrc).not.toMatch(/useMic|from "@hanzo\/voice"/);
    expect(askAi).not.toMatch(/import [^;]*from "[^"]*\/mic"/);
  });
});
