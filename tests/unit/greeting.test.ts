import { firstName } from "@/lib/greeting";

describe("firstName", () => {
  it("takes the name a person answers to, not their record", () => {
    expect(firstName("Zach Kelling")).toBe("Zach");
    expect(firstName("  Ada  Lovelace ")).toBe("Ada");
  });

  it("reads a login as a login", () => {
    expect(firstName("zach.kelling@hanzo.ai")).toBe("zach");
    expect(firstName("zach+cloud@hanzo.ai")).toBe("zach");
    expect(firstName("z@hanzo.ai")).toBe("z");
  });

  it("leaves a chosen handle exactly as it was chosen", () => {
    // Capitalising someone's handle is a guess about who they are.
    expect(firstName("z")).toBe("z");
    expect(firstName("maxpower")).toBe("maxpower");
  });

  it("has nothing to say when the account has no name", () => {
    // The caller falls back to "there", so this must be empty rather than a guess.
    expect(firstName("")).toBe("");
    expect(firstName(null)).toBe("");
    expect(firstName(undefined)).toBe("");
  });
});
