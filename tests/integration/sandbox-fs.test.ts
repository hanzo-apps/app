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
import { SandboxProjectFs, openBox } from "@/lib/agent/sandbox-fs";

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
function stubBox(initial: Record<string, string>) {
  const tree = new Map(Object.entries(initial));
  const calls: string[] = [];
  const auth: string[] = [];
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

    if (method === "POST" && p === "/v1/sandbox/boxes") {
      return Response.json({ id: BOX, project: json().project, class: json().class, status: "running" }, { status: 201 });
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

  return { tree, calls, auth, handler, exec: () => lastExec };
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

function make(initial: Record<string, string>) {
  const stub = stubBox(initial);
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
    await expect(fs.write("/a.txt", "x")).rejects.toThrow(/box returned 503/);
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

  it("reports an unreachable box as exit -1, not as a failed program", async () => {
    const { fs } = make({});
    globalThis.fetch = (async () => new Response("", { status: 502 })) as typeof fetch;
    const r = await fs.exec("true");
    expect(r.exitCode).toBe(-1);
    expect(r.stderr).toContain("502");
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
