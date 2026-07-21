import { isConversational } from "@/components/editor/ask-ai/intent";

// In BUILD mode a plain question/greeting must be ANSWERED (routed to the chat
// reply), not treated as a build instruction that regenerates and replaces the app
// — the "what can you do → nukes my app" bug. These lock the conservative heuristic:
// clear questions/greetings are conversational; anything with build intent is not.

describe("isConversational (Build-mode question guard)", () => {
  it("treats plain questions and greetings as conversational", () => {
    for (const s of [
      "what can you do",
      "what can you do?",
      "hi",
      "hello",
      "hey there",
      "help",
      "who are you?",
      "how does this work?",
      "why is it empty?",
      "can you explain what this does?",
      "thanks",
      "is this working?",
      "do you support images?",
    ]) {
      expect(isConversational(s)).toBe(true);
    }
  });

  it("treats build instructions as NOT conversational (they must build)", () => {
    for (const s of [
      "build a todo app",
      "make a landing page",
      "create a pricing section",
      "add a login form",
      "change the header color",
      "fix the footer spacing",
      "redesign the hero",
      "remove the sidebar",
      "generate a dashboard",
      "write a contact form",
      "clone the stripe homepage",
      "i want a blog",
      "give me a portfolio site",
      "a beautiful landing page for my coffee startup with a menu and testimonials",
    ]) {
      expect(isConversational(s)).toBe(false);
    }
  });

  it("does not intercept a long descriptive brief even if it reads like prose", () => {
    const brief =
      "an analytics dashboard that shows revenue, active users and churn with charts and a date filter";
    expect(isConversational(brief)).toBe(false); // > 140 chars OR build-ish → build
  });

  it("ignores whitespace and empty input", () => {
    expect(isConversational("   ")).toBe(false);
    expect(isConversational("  what can you do?  ")).toBe(true);
  });
});
