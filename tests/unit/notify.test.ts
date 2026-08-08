/** @jest-environment jsdom */
import { canAsk, dismiss, enable, notifySettled, supported } from "@/lib/notify";

/**
 * The notification contract, behaviourally.
 *
 * jsdom has no Notification, which is itself the first case: iOS Safari
 * outside an installed PWA is exactly this environment, and every function
 * must answer calmly there rather than throw.
 */
describe("without a Notification API at all", () => {
  it("nothing is supported, nothing asks, nothing fires, nothing throws", async () => {
    expect(supported()).toBe(false);
    expect(canAsk()).toBe(false);
    await expect(enable()).resolves.toBe(false);
    expect(() => notifySettled(true, "done")).not.toThrow();
  });
});

describe("with the API present", () => {
  const fired: Array<{ title: string; body?: string; tag?: string }> = [];
  let permission = "default";

  beforeEach(() => {
    fired.length = 0;
    permission = "default";
    localStorage.clear();

    class FakeNotification {
      static requestPermission = jest.fn(async () => {
        permission = "granted";
        return "granted";
      });
      static get permission() {
        return permission;
      }
      onclick: (() => void) | null = null;
      close = jest.fn();
      constructor(title: string, opts?: { body?: string; tag?: string }) {
        fired.push({ title, ...opts });
      }
    }
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: FakeNotification,
    });
  });

  afterEach(() => {
    // @ts-expect-error — removing the fake
    delete window.Notification;
  });

  it("asks only while undecided", () => {
    expect(canAsk()).toBe(true);
    permission = "denied";
    expect(canAsk()).toBe(false);
    permission = "granted";
    expect(canAsk()).toBe(false);
  });

  it("a dismissal is remembered", () => {
    expect(canAsk()).toBe(true);
    dismiss();
    expect(canAsk()).toBe(false);
  });

  it("enable resolves the browser's answer", async () => {
    await expect(enable()).resolves.toBe(true);
    expect(permission).toBe("granted");
  });

  it("fires only for a HIDDEN tab with permission granted", () => {
    permission = "granted";
    // jsdom's document is visible by default.
    notifySettled(true, "Built the landing page");
    expect(fired).toHaveLength(0);

    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    notifySettled(true, "Built the landing page");
    expect(fired).toHaveLength(1);
    expect(fired[0].title).toBe("Build finished");
    expect(fired[0].tag).toBe("hanzo-build");

    notifySettled(false, "The stream ended early");
    expect(fired[1].title).toBe("Build failed");

    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  it("stays silent without permission, even hidden", () => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    permission = "default";
    notifySettled(true, "x");
    permission = "denied";
    notifySettled(true, "x");
    expect(fired).toHaveLength(0);
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });

  it("caps the body — a notification is a headline, not the summary", () => {
    permission = "granted";
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    notifySettled(true, "y".repeat(500));
    expect(fired[0].body).toHaveLength(160);
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
  });
});
