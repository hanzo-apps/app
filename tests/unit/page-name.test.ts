import { pageName } from "@/lib/pages/name";

/**
 * The header pill says what a PERSON calls the page. Derived, never stored, so
 * a rename keeps working and nothing drifts.
 */
describe("pageName", () => {
  it("index is the Homepage", () => {
    expect(pageName("index.html")).toBe("Homepage");
    expect(pageName("INDEX.HTML")).toBe("Homepage");
  });

  it("names a nested page by its own stem", () => {
    expect(pageName("about/team.html")).toBe("Team");
  });

  it("reads kebab and snake as words", () => {
    expect(pageName("contact-us.html")).toBe("Contact Us");
    expect(pageName("privacy_policy.html")).toBe("Privacy Policy");
  });

  it("survives the shapes that break naive splits", () => {
    expect(pageName("")).toBe("");
    expect(pageName("no-extension")).toBe("No Extension");
    expect(pageName(".html")).toBe(".html");
  });
});
