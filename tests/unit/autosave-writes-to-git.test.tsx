import { act, renderHook, waitFor } from "@testing-library/react";

/**
 * Autosave must write to the project's repo, and must never say saved unless it
 * did.
 *
 * Measured in production before this change: the hook wrote
 * `PUT /v1/me/projects/<ns>/<repo>`, a route backed by `@huggingface/hub` that
 * looks the project up in an HF-shaped store. With a HEALTHY backend that store
 * answered `{"ok":true,"projects":[]}` and the per-project GET answered
 * `404 {"error":"Project not found"}`, so every write failed and the status bar
 * read "Not saved — retrying" forever. It was telling the truth.
 *
 * These pin the two things that would bring the lie back: writing anywhere other
 * than the commit path, and reporting a failed write as saved.
 */

const commitTurn = jest.fn();
jest.mock("@/lib/git/commit-turn", () => ({ commitTurn: (...a: unknown[]) => commitTurn(...a) }));
jest.mock("@/lib/dev/workspace", () => ({ currentProject: (hint?: string | null) => hint || "" }));

// A live fetch would mean a second write path existed; nothing here may call it.
const fetchSpy = jest.fn();

import { useAutosave } from "@/hooks/useAutosave";

const pages = [{ path: "index.html", html: "<h1>hi</h1>" }];

beforeEach(() => {
  jest.useFakeTimers();
  commitTurn.mockReset();
  fetchSpy.mockReset();
  global.fetch = fetchSpy as unknown as typeof fetch;
});
afterEach(() => jest.useRealTimers());

/** Let the debounce fire and the write settle. */
async function settle() {
  await act(async () => {
    jest.advanceTimersByTime(2_500);
  });
}

describe("useAutosave", () => {
  it("commits to the project's repo — and makes no other request", async () => {
    commitTurn.mockResolvedValue({ ok: true, repo: "me/megashop", commit: "abc", linked: true });
    renderHook(() => useAutosave("megashop", pages, ["build me a shop"], false));
    await settle();

    expect(commitTurn).toHaveBeenCalledTimes(1);
    const [repo, sent, message] = commitTurn.mock.calls[0];
    expect(repo).toBe("megashop");
    expect(sent).toEqual(pages);
    // The last prompt names the commit, so history reads as the conversation.
    expect(message).toBe("build me a shop");
    // No HF route, no second write path.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("says saved ONLY after the commit lands", async () => {
    commitTurn.mockResolvedValue({ ok: true, repo: "me/x", commit: "abc", linked: true });
    const { result } = renderHook(() => useAutosave("x", pages, [], false));
    expect(result.current.state).not.toBe("saved");
    await settle();
    await waitFor(() => expect(result.current.state).toBe("saved"));
    expect(result.current.at).toBeInstanceOf(Date);
  });

  it("reports a refused commit as an error, never as saved", async () => {
    commitTurn.mockResolvedValue({ ok: false, reason: "forge unreachable" });
    const { result } = renderHook(() => useAutosave("x", pages, [], false));
    await settle();
    await waitFor(() => expect(result.current.state).toBe("error"));
    expect(result.current.at).toBeNull();
  });

  it("reports a thrown commit as an error too", async () => {
    commitTurn.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useAutosave("x", pages, [], false));
    await settle();
    await waitFor(() => expect(result.current.state).toBe("error"));
  });

  it("never writes mid-generation — a partial document is not a save", async () => {
    commitTurn.mockResolvedValue({ ok: true, repo: "me/x", commit: "a", linked: true });
    renderHook(() => useAutosave("x", pages, [], true)); // busy
    await settle();
    expect(commitTurn).not.toHaveBeenCalled();
  });

  it("has nowhere to save without a name, and says so", async () => {
    const { result } = renderHook(() => useAutosave(undefined, pages, [], false));
    await settle();
    expect(result.current.state).toBe("unsaved");
    expect(commitTurn).not.toHaveBeenCalled();
  });

  it("saveNow answers whether the write landed", async () => {
    commitTurn.mockResolvedValue({ ok: false, reason: "nope" });
    const { result } = renderHook(() => useAutosave("x", pages, [], false));
    await act(async () => {
      await expect(result.current.saveNow()).resolves.toBe(false);
    });

    commitTurn.mockResolvedValue({ ok: true, repo: "me/x", commit: "a", linked: true });
    await act(async () => {
      await expect(result.current.saveNow()).resolves.toBe(true);
    });
  });

  it("does not re-commit unchanged pages, and calls that a success", async () => {
    commitTurn.mockResolvedValue({ ok: true, repo: "me/x", commit: "a", linked: true });
    const { result } = renderHook(() => useAutosave("x", pages, [], false));
    await settle();
    expect(commitTurn).toHaveBeenCalledTimes(1);

    // A second flush with identical content must not write a duplicate commit —
    // the duplicate-per-turn history is exactly what this change removed.
    await act(async () => {
      await expect(result.current.saveNow()).resolves.toBe(true);
    });
    expect(commitTurn).toHaveBeenCalledTimes(1);
  });
});
