/**
 * The sandbox filesystem, against a stub of the box.
 *
 * What is worth testing here is not "does fetch work" but three claims the seam
 * makes:
 *
 *   1. a `SandboxProjectFs` is substitutable for the in-memory one everywhere
 *      the agent touches it;
 *   2. the edit semantics are IDENTICAL on both — a model must not get
 *      different behaviour depending on where it happens to be running;
 *   3. it speaks the contract that actually exists.
 *
 * (3) is why the stub below answers `/v1/sandbox/boxes/:id/fs/*` and not the
 * routes this file used to call. The previous client spoke to a Daytona-fork
 * daemon (`/files`, `/process/execute`) that was deleted with the fork, and
 * every one of those tests passed against a stub of a server that no longer
 * existed anywhere. The paths asserted here are the ones declared in
 * `hanzoai/cloud`'s `apps/sandbox/wire` and served by `cmd/boxd`.
 */
import { InMemoryProjectFs, canExec, type ProjectFs } from "@/lib/agent/fs";
import {
  DEFAULT_BOX_TTL_SEC,
  SandboxProjectFs,
  openBox,
  releaseBox,
} from "@/lib/agent/sandbox-fs";

const BASE = "https://api.hanzo.test/v1";
const BOX = "box-abc123";
const PREFIX = `/v1/sandbox/boxes/${BOX}`;

/**
 * A stand-in for cloud + the box behind it.
 *
 * It filters `node_modules`/`.git` out of a listing because THE BOX does that
 * (`cmd/boxd/fs.go`'s `skip` set) — the tree never crosses the network to be
 * discarded. The client holds no second copy of that rule, so a stub that
 * returned them would be modelling a server that does not exist.
 */
function stubBox(
  initial: Record<string, string>,
  /**
   * Break a route on purpose. A stub that can only answer 200 or 404 cannot
   * express "the box is there but refuses" (409, what cloud's proxy returns for
   * a suspended box) or "the box tried and failed" (500, what boxd returns when
   * a file exists but cannot be opened) — and those are exactly the answers a
   * client is most likely to mistake for "the file is not there".
   */
  fault?: (method: string, path: string) => number | undefined
) {
  const tree = new Map(Object.entries(initial));
  const calls: string[] = [];
  const auth: string[] = [];
  const created: Array<Record<string, unknown>> = [];
  const skip = /(^|\/)(\.git|node_modules|\.next|dist|build|target|\.venv|__pycache__)(\/|$)/;
  let lastExec: { command?: string; timeoutSec?: number } | null = null;

  const handler = async (req: {
    method: string;
    url: URL;
    body: string | undefined;
    headers: Record<string, string>;
  }): Promise<Response> => {
    const { method, url } = req;
    const p = url.pathname;
    calls.push(`${method} ${p}`);
    if (req.headers.Authorization) auth.push(req.headers.Authorization);
    const json = () => (req.body ? JSON.parse(req.body) : {});
    const path = url.searchParams.get("path") ?? "";

    const broken = fault?.(method, p);
    if (broken) return Response.json({ error: `forced ${broken}` }, { status: broken });

    if (method === "POST" && p === "/v1/sandbox/boxes") {
      created.push(json());
      return Response.json({ id: BOX, project: json().project, class: json().class, status: "running" }, { status: 201 });
    }
    if (method === "GET" && p === "/v1/sandbox/boxes") {
      const want = url.searchParams.get("project");
      const status = url.searchParams.get("status");
      const live = { id: BOX, project: want ?? "", class: "dev", status: "running" };
      return Response.json({ boxes: status && status !== "running" ? [] : [live] });
    }
    if (method === "POST" && p === `${PREFIX}/suspend`) {
      return Response.json({ id: BOX, status: "suspended" });
    }
    if (method === "GET" && p === `${PREFIX}/fs/list`) {
      return Response.json({
        entries: [...tree.keys()]
          .filter((k) => !skip.test(k))
          .map((k) => ({ path: k, size: tree.get(k)!.length, mode: "-rw-r--r--", isDir: false })),
      });
    }
    if (method === "GET" && p === `${PREFIX}/fs/read`) {
      const c = tree.get(path);
      return c === undefined
        ? Response.json({ error: "no such file" }, { status: 404 })
        : new Response(c, { headers: { "Content-Type": "application/octet-stream" } });
    }
    if (method === "POST" && p === `${PREFIX}/fs/write`) {
      const b = json();
      tree.set(String(b.path), String(b.content));
      return new Response(null, { status: 204 });
    }
    if (method === "GET" && p === `${PREFIX}/fs/search`) {
      const needle = (url.searchParams.get("q") ?? "").toLowerCase();
      const matches: Array<{ path: string; line: number; text: string }> = [];
      for (const [k, v] of tree) {
        if (skip.test(k)) continue;
        v.split("\n").forEach((text, i) => {
          if (text.toLowerCase().includes(needle)) matches.push({ path: k, line: i + 1, text: text.trim() });
        });
      }
      return Response.json({ matches });
    }
    if (method === "POST" && p === `${PREFIX}/proc/exec`) {
      lastExec = json();
      return Response.json({ exitCode: 1, stdout: "2 passing\n", stderr: "1 failing\n", durationMs: 42 });
    }
    return Response.json({ error: `unhandled ${method} ${p}` }, { status: 500 });
  };

  return { tree, calls, auth, created, handler, exec: () => lastExec };
}

/** fetch(), reduced to what the stub needs and nothing the client can't send. */
function installFetch(stub: ReturnType<typeof stubBox>) {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) =>
    stub.handler({
      method: init?.method ?? "GET",
      url: new URL(String(input)),
      body: typeof init?.body === "string" ? init.body : undefined,
      headers: (init?.headers ?? {}) as Record<string, string>,
    })) as typeof fetch;
}

function make(
  initial: Record<string, string>,
  fault?: (method: string, path: string) => number | undefined
) {
  const stub = stubBox(initial, fault);
  installFetch(stub);
  return { stub, fs: new SandboxProjectFs({ baseUrl: BASE, boxId: BOX, token: "tok-123" }) };
}

describe("SandboxProjectFs", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("reads and writes through the box, not the local disk", async () => {
    const { stub, fs } = make({ "/index.html": "<h1>Hi</h1>" });

    expect(await fs.read("/index.html")).toBe("<h1>Hi</h1>");
    await fs.write("/new.txt", "made");

    expect(stub.tree.get("/new.txt")).toBe("made");
    expect(stub.calls).toContain(`POST ${PREFIX}/fs/write`);
  });

  it("calls the routes cmd/boxd actually serves", async () => {
    // The defect this replaces: the previous client's every route 404'd, and
    // its tests all passed. Pinning the paths is what makes that impossible.
    const { stub, fs } = make({ "/a.txt": "one" });
    await fs.list();
    await fs.read("/a.txt");
    await fs.exists("/a.txt");
    await fs.write("/b.txt", "two");
    await fs.search("one");
    await fs.exec("true");

    expect(stub.calls).toEqual([
      `GET ${PREFIX}/fs/list`,
      `GET ${PREFIX}/fs/read`,
      `GET ${PREFIX}/fs/read`,
      `POST ${PREFIX}/fs/write`,
      `GET ${PREFIX}/fs/search`,
      `POST ${PREFIX}/proc/exec`,
    ]);
  });

  it("sends the caller's IAM bearer and never a service key", async () => {
    // The box's own credential lives in cloud and is added on the SECOND hop.
    // If it ever appeared here, this process would be holding a key that grants
    // access to every tenant's boxes.
    const { stub, fs } = make({ "/a.txt": "one" });
    await fs.read("/a.txt");
    expect(stub.auth).toEqual(["Bearer tok-123"]);
  });

  it("reports only what it changed, never the whole checkout", async () => {
    const { fs } = make({ "/a.txt": "a", "/b.txt": "b", "/c.txt": "c" });

    await fs.write("/b.txt", "edited");

    expect(await fs.changedPaths()).toEqual(["/b.txt"]);
    expect(await fs.changedFiles()).toEqual([{ path: "/b.txt", content: "edited" }]);
    expect(await fs.list()).toHaveLength(3);
  });

  it("does not re-filter what the box already dropped", async () => {
    // One definition of "what an agent should not read", and it lives on the
    // box. The client returns the listing it is given.
    const { fs } = make({ "/src/App.tsx": "x", "/node_modules/react/index.js": "y", "/.git/HEAD": "z" });
    expect(await fs.list()).toEqual(["/src/App.tsx"]);
  });

  it("returns null for a missing file rather than throwing", async () => {
    const { fs } = make({});
    expect(await fs.read("/nope.txt")).toBeNull();
    expect(await fs.exists("/nope.txt")).toBe(false);
  });

  it("greps on the box", async () => {
    const { fs } = make({ "/a.txt": "one\ntwo\nthree" });
    expect(await fs.search("two")).toEqual([{ path: "/a.txt", line: 2, text: "two" }]);
  });

  it("raises a failed write instead of silently losing the edit", async () => {
    const { fs } = make({});
    globalThis.fetch = (async () => new Response("nope", { status: 503 })) as typeof fetch;
    await expect(fs.write("/a.txt", "x")).rejects.toThrow(/returned 503/);
  });
});

describe("run_command", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("is a capability of a box and not of a map", () => {
    const { fs } = make({});
    expect(canExec(fs)).toBe(true);
    expect(canExec(new InMemoryProjectFs([]))).toBe(false);
  });

  it("carries the command and its deadline to the box", async () => {
    const { stub, fs } = make({});
    await fs.exec("pnpm test", 300);
    expect(stub.exec()).toEqual({ command: "pnpm test", timeoutSec: 300 });
  });

  it("returns a failing program as a successful call", async () => {
    // The distinction the whole result type exists for: "your tests failed" and
    // "the box is broken" are different facts, and a caller that cannot tell
    // them apart retries the wrong one.
    const { fs } = make({});
    const r = await fs.exec("pnpm test");
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("2 passing");
    expect(r.stderr).toContain("1 failing");
  });

  it("raises an unreachable box instead of returning it as a program result", async () => {
    // Same intent this test always had — "the box is broken" must not arrive
    // looking like "your command failed" — with the mechanism corrected. It
    // used to assert exitCode -1, but boxd ALREADY spends -1 on "the binary
    // never launched" (`proc.go`), so a model seeing -1 could not tell a
    // missing command from a missing box and would retry the wrong one. Every
    // other method on this class raises a broken box; exec is not an exception.
    const { fs } = make({});
    globalThis.fetch = (async () => new Response("", { status: 502 })) as typeof fetch;
    await expect(fs.exec("true")).rejects.toThrow(/502/);
  });
});

describe("openBox", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("asks cloud for a box and hands back its id", async () => {
    const stub = stubBox({});
    installFetch(stub);
    const box = await openBox({ baseUrl: BASE, token: "tok-123", project: "acme/site" });
    expect(box?.id).toBe(BOX);
    expect(box?.project).toBe("acme/site");
    expect(stub.calls).toContain("POST /v1/sandbox/boxes");
  });

  it("returns null when the sandbox service is unreachable, so a run can fall back", async () => {
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as typeof fetch;
    expect(await openBox({ baseUrl: BASE, token: "t", project: "p" })).toBeNull();
  });
});

describe("edit semantics are identical on both filesystems", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  /**
   * Run one scenario against both implementations and compare.
   *
   * This is the load-bearing assertion in the file, and the reason boxd has no
   * `fs/patch` endpoint: what `update` means when `oldStr` appears twice is ONE
   * fact, defined once in `patch.ts` and applied client-side on both paths. A
   * Go copy on the far side of the network would be a second definition that
   * this test could not see disagreeing.
   */
  async function bothAgree(
    initial: Record<string, string>,
    act: (fs: ProjectFs) => Promise<unknown>
  ) {
    const memory = new InMemoryProjectFs(
      Object.entries(initial).map(([path, content]) => ({ path, content }))
    );
    const memoryResult = await act(memory);
    const memoryFiles = await memory.changedFiles();

    const { fs: sandbox } = make(initial);
    const sandboxResult = await act(sandbox);
    const sandboxFiles = await sandbox.changedFiles();

    expect(sandboxResult).toEqual(memoryResult);
    expect(sandboxFiles).toEqual(memoryFiles);
  }

  it("agrees on a unique update", async () => {
    await bothAgree({ "/a.txt": "<h1>Hi</h1>" }, (fs) =>
      fs.applyPatch("/a.txt", [{ type: "update", oldStr: "Hi", newStr: "Hello" }])
    );
  });

  it("agrees on refusing an ambiguous update", async () => {
    // Both must refuse: replacing the wrong one of two identical spans is a
    // silent corruption, and it must not depend on which box you are on.
    await bothAgree({ "/a.txt": "x x" }, (fs) =>
      fs.applyPatch("/a.txt", [{ type: "update", oldStr: "x", newStr: "y" }])
    );
  });

  it("agrees on a rewrite of a file that does not exist yet", async () => {
    await bothAgree({}, (fs) => fs.applyPatch("/new.txt", [{ type: "rewrite", content: "fresh" }]));
  });

  it("agrees on partial application when one op of two misses", async () => {
    await bothAgree({ "/a.txt": "keep" }, (fs) =>
      fs.applyPatch("/a.txt", [
        { type: "update", oldStr: "keep", newStr: "kept" },
        { type: "update", oldStr: "absent", newStr: "never" },
      ])
    );
  });
});

/**
 * "Missing" is not "broken".
 *
 * Every test above answers 200 or 404, which is the happy path plus the one
 * failure that IS data. These are the answers in between. The client used to
 * map all of them onto the value that means "absent" — `null`, `[]`, `false` —
 * and the most expensive consequence was not a confused model: it was
 * `applyPatch` reading a phantom empty file and WRITING the result over a file
 * that was intact, while returning a PatchResult identical to the in-memory
 * one. Data loss that the equivalence assertion could not see.
 */
describe("SandboxProjectFs failure semantics", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const only = (badPath: string, status: number) => (_m: string, p: string) =>
    p.endsWith(badPath) ? status : undefined;

  it("does not destroy a file when the read that precedes the patch fails", async () => {
    const { stub, fs } = make({ "/a.txt": "REAL CONTENT" }, only("/fs/read", 500));

    // The prepend form: oldStr "" matches at offset 0, so this op cannot miss
    // and the write always happens. Against a phantom empty file it writes the
    // header ALONE, and the file's real content is gone.
    await expect(
      fs.applyPatch("/a.txt", [{ type: "update", oldStr: "", newStr: "// header\n" }])
    ).rejects.toThrow(/500/);

    expect(stub.tree.get("/a.txt")).toBe("REAL CONTENT");
    expect(stub.calls).not.toContain(`POST ${PREFIX}/fs/write`);
  });

  it("reports a 404 as absent and everything else as a failure", async () => {
    const { fs } = make({ "/a.txt": "one" });
    expect(await fs.read("/missing.txt")).toBeNull();
    expect(await fs.exists("/missing.txt")).toBe(false);

    const { fs: broken } = make({ "/a.txt": "one" }, only("/fs/read", 500));
    await expect(broken.read("/a.txt")).rejects.toThrow(/500/);
    await expect(broken.exists("/a.txt")).rejects.toThrow(/500/);
  });

  it("does not present a suspended box as an empty project", async () => {
    // cloud answers 409 for a box that is not running. Reporting that as an
    // empty listing, no matches and no such file lets the model conclude the
    // checkout is empty and start rewriting it from scratch.
    const { fs } = make({ "/a.txt": "one", "/b.txt": "two" }, () => 409);

    await expect(fs.list()).rejects.toThrow(/409/);
    await expect(fs.search("one")).rejects.toThrow(/409/);
    await expect(fs.exists("/a.txt")).rejects.toThrow(/409/);
    await expect(fs.exec("true")).rejects.toThrow(/409/);
  });

  it("names the box in the failure, so a broken one is identifiable", async () => {
    const { fs } = make({}, () => 502);
    await expect(fs.list()).rejects.toThrow(BOX);
  });
});

describe("openBox", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("bounds the life of every box it opens", async () => {
    const stub = stubBox({});
    installFetch(stub);
    await openBox({ baseUrl: BASE, token: "tok-123", project: "acme" });
    expect(stub.created[0]).toMatchObject({ project: "acme", class: "dev" });
    expect(stub.created[0]!.ttlSec).toBe(DEFAULT_BOX_TTL_SEC);
  });

  it("recovers the live box when cloud refuses a second one", async () => {
    // 409 means "this project already has a box" — which is the box the caller
    // asked for. Treating it as failure sent the next run to an empty in-memory
    // map while the real checkout sat in a box nobody looked up.
    const stub = stubBox({}, (m, p) => (m === "POST" && p === "/v1/sandbox/boxes" ? 409 : undefined));
    installFetch(stub);

    const box = await openBox({ baseUrl: BASE, token: "tok-123", project: "acme" });

    expect(box?.id).toBe(BOX);
    expect(stub.calls).toEqual(["POST /v1/sandbox/boxes", "GET /v1/sandbox/boxes"]);
  });

  it("falls back to memory when the conflicting box is not runnable", async () => {
    // A pending box holds the volume but its proxy refuses every call. Handing
    // one back would produce a filesystem whose every method throws.
    const stub = stubBox({}, (m, p) =>
      m === "POST" && p === "/v1/sandbox/boxes" ? 409 : undefined
    );
    installFetch(stub);
    const orig = stub.handler;
    const noneRunning = async (req: Parameters<typeof orig>[0]) => {
      if (req.method === "GET" && req.url.pathname === "/v1/sandbox/boxes") {
        stub.calls.push("GET /v1/sandbox/boxes");
        return Response.json({ boxes: [] });
      }
      return orig(req);
    };
    installFetch({ ...stub, handler: noneRunning });

    expect(await openBox({ baseUrl: BASE, token: "tok-123", project: "acme" })).toBeNull();
  });
});

describe("releaseBox", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("suspends rather than deletes, so the checkout survives the run", async () => {
    const stub = stubBox({});
    installFetch(stub);
    expect(await releaseBox({ baseUrl: BASE, token: "tok-123", boxId: BOX })).toBe(true);
    expect(stub.calls).toEqual([`POST ${PREFIX}/suspend`]);
  });

  it("reports failure instead of throwing into a finished run", async () => {
    const stub = stubBox({}, () => 500);
    installFetch(stub);
    expect(await releaseBox({ baseUrl: BASE, token: "tok-123", boxId: BOX })).toBe(false);
  });
});
