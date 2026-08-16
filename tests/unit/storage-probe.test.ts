/**
 * Whether this browser keeps anything is answered by WRITING to it.
 *
 * "Is there a store" has three different negative answers and they look nothing
 * alike: a server has no DOM, a denied origin THROWS a SecurityError on the
 * property read, and some privacy modes hand back `null` in place of the store
 * (measured: Firefox `dom.storage.enabled=false`, Chromium
 * `--disable-local-storage`). A read-only probe returns the third as a usable
 * store and returns a quota-exhausted store as usable too.
 *
 * It matters here because sign-in is the consumer. The PKCE verifier is written
 * before the redirect to hanzo.id and read back when the browser returns; with
 * nowhere to put it the person authenticates at the IdP and comes back to a
 * callback that has nothing to exchange. `app/login` reads this value to say so
 * up front rather than after the round trip.
 */
function load() {
  let mod: typeof import("@/lib/hanzo/iam");
  jest.isolateModules(() => {
    mod = require("@/lib/hanzo/iam");
  });
  return mod!;
}

/** Install a `window.localStorage` and evaluate the module against it. */
function given(get: () => Storage | null) {
  Object.defineProperty(window, "localStorage", { get, configurable: true });
  return load();
}

const real = Object.getOwnPropertyDescriptor(window, "localStorage")!;
afterEach(() => Object.defineProperty(window, "localStorage", real));

test("a store that takes a write is the store", () => {
  const store = window.localStorage;
  expect(given(() => store).storage).toBe(store);
});

test("a store that REFUSES the write is no store", () => {
  // Quota exhausted, or a privacy mode that exposes the object and throws.
  const refuses = {
    ...window.localStorage,
    setItem: () => {
      throw new DOMException("quota", "QuotaExceededError");
    },
    removeItem: () => {},
  } as unknown as Storage;
  expect(given(() => refuses).storage).toBeNull();
});

test("a property read that THROWS is no store", () => {
  expect(
    given(() => {
      throw new DOMException("denied", "SecurityError");
    }).storage,
  ).toBeNull();
});

test("a store that is NULL is no store", () => {
  expect(given(() => null).storage).toBeNull();
});

test("the SDK is always handed a Storage, whatever the browser says", () => {
  // `IAMConfig.storage` is typed `Storage`; the SDK reads it with no null check
  // and resolves its own PKCE store from it. Null there is a crash, not a
  // degradation, so the in-memory shim stands in — the refusal is expressed by
  // `storage`, never by handing the SDK nothing.
  const denied = given(() => null);
  expect(denied.storage).toBeNull();
  expect(denied.iamConfig.storage).not.toBeNull();
  expect(typeof denied.iamConfig.storage!.setItem).toBe("function");
});
