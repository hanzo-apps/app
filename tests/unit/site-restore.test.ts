import { readFileSync } from "fs";
import { join } from "path";

const src = readFileSync(
  join(__dirname, "../../app/v1/apps/[slug]/site/route.ts"),
  "utf8",
);

/**
 * The restore path may only load content the record OWNS.
 *
 * Sighted live on v1.42.400 (owner screenshot): project "MEGA Shop" opened
 * with a different site's content ("Osage Brothers · Support") loaded as its
 * pages — one autosave away from committing someone else's pages into this
 * project's repo as its own. The mechanism: the route probed three bases, and
 * the third — `https://<slug>.hanzo.app` — is a GLOBAL namespace while the two
 * S3 bases are org-scoped. For a record that was never published, the vanity
 * host is whatever else answers there.
 *
 * Source-level, like the other route guards: each property is one expression a
 * refactor could drop without breaking a type.
 */
describe("/v1/apps/:slug/site", () => {
  it("gates the vanity base on the record claiming it", () => {
    // `status === 'live'` is the record saying "the artifact at that host is
    // mine". Publish enforces global slug uniqueness, so live ⇒ ownership.
    expect(src).toMatch(
      /record\?\.status === 'live' \? siteBase\(`https:\/\/\$\{clean\}\.hanzo\.app\/index\.html`\) : null/,
    );
  });

  it("keeps the org-scoped bases unconditional — they cannot serve a stranger", () => {
    expect(src).toMatch(/record\?\.liveUrl \? siteBase\(record\.liveUrl\) : null/);
    expect(src).toMatch(/s3\.hanzo\.ai\/\$\{bucket\}\/\$\{org\}\/\$\{clean\}/);
  });

  it("still refuses the platform shell as content", () => {
    // The wildcard serves the console for unclaimed hosts; a page referencing
    // /_next/static is that shell, never a published artifact.
    expect(src).toMatch(/_next\/static/);
  });

  it("keeps the SSRF allowlist — only our own hosts are ever fetched", () => {
    expect(src).toMatch(/h === 's3\.hanzo\.ai' \|\| h\.endsWith\('\.hanzo\.app'\)/);
  });
});
