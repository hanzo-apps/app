/**
 * The sandbox filesystem, against a stub of the Hanzo Runtime daemon.
 *
 * What is worth testing here is not "does fetch work" but the two claims the
 * seam makes: that a `SandboxProjectFs` is substitutable for the in-memory one
 * everywhere the agent touches it, and that the edit semantics are identical
 * on both — a model must not get different behaviour depending on where it
 * happens to be running.
 */
import { InMemoryProjectFs, type ProjectFs } from "@/lib/agent/fs";
import { SandboxProjectFs } from "@/lib/agent/sandbox-fs";

const PROJECT_DIR = "/workspace/app";

/** A stand-in for the daemon: holds a tree, speaks its toolbox routes. */
function stubDaemon(initial: Record<string, string>) {
  const tree = new Map(Object.entries(initial));
  const calls: string[] = [];

  const handler = async (input: string | URL | Request): Promise<Response> => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    const req = input as Request;
    calls.push(`${req?.method ?? "GET"} ${url.pathname}`);
    const p = url.searchParams.get("path") ?? "";
    const rel = p.startsWith(PROJECT_DIR) ? p.slice(PROJECT_DIR.length) : p;

    if (url.pathname === "/files" && !url.pathname.includes("download")) {
      return Response.json(
        [...tree.keys()].map((k) => ({ path: `${PROJECT_DIR}${k}`, isDir: false }))
      );
    }
    if (url.pathname === "/files/info") {
      return tree.has(rel) ? Response.json({ name: rel }) : new Response("no", { status: 404 });
    }
    if (url.pathname === "/files/download") {
      const c = tree.get(rel);
      return c === undefined ? new Response("no", { status: 404 }) : new Response(c);
    }
    if (url.pathname === "/files/upload") {
      const body = JSON.parse((req.body as unknown as string) ?? "{}");
      const target = String(body.path).slice(PROJECT_DIR.length);
      tree.set(target, String(body.content));
      return Response.json({ ok: true });
    }
    if (url.pathname === "/files/find") {
      const needle = url.searchParams.get("pattern") ?? "";
      const out: Array<{ file: string; line: number; content: string }> = [];
      for (const [k, v] of tree) {
        v.split("\n").forEach((text, i) => {
          if (text.includes(needle)) out.push({ file: `${PROJECT_DIR}${k}`, line: i + 1, content: text });
        });
      }
      return Response.json(out);
    }
    return new Response("unhandled", { status: 500 });
  };

  return { tree, calls, handler };
}

/** fetch() with a body we can read back synchronously in the stub. */
function installFetch(handler: (input: string | URL | Request) => Promise<Response>) {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const shim = {
      method: init?.method ?? "GET",
      body: init?.body,
      toString: () => String(input),
    } as unknown as Request;
    return handler(shim);
  }) as typeof fetch;
}

describe("SandboxProjectFs", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  function make(initial: Record<string, string>) {
    const d = stubDaemon(initial);
    installFetch(d.handler);
    return {
      d,
      fs: new SandboxProjectFs({ baseUrl: "http://sandbox:2280", projectDir: PROJECT_DIR }),
    };
  }

  it("reads and writes through the daemon, not the local disk", async () => {
    const { d, fs } = make({ "/index.html": "<h1>Hi</h1>" });

    expect(await fs.read("/index.html")).toBe("<h1>Hi</h1>");
    await fs.write("/new.txt", "made");

    expect(d.tree.get("/new.txt")).toBe("made");
    expect(d.calls).toContain("POST /files/upload");
  });

  it("reports only what it changed, never the whole checkout", async () => {
    // The distinction that matters: a real tree has files the agent never
    // touched, and shipping them back through an SSE frame would be absurd.
    const { fs } = make({ "/a.txt": "a", "/b.txt": "b", "/c.txt": "c" });

    await fs.write("/b.txt", "edited");

    expect(await fs.changedPaths()).toEqual(["/b.txt"]);
    expect(await fs.changedFiles()).toEqual([{ path: "/b.txt", content: "edited" }]);
    expect(await fs.list()).toHaveLength(3);
  });

  it("hides the directories no agent should be reading", async () => {
    const { fs } = make({ "/src/App.tsx": "x", "/node_modules/react/index.js": "y", "/.git/HEAD": "z" });
    expect(await fs.list()).toEqual(["/src/App.tsx"]);
  });

  it("returns null for a missing file rather than throwing", async () => {
    const { fs } = make({});
    expect(await fs.read("/nope.txt")).toBeNull();
    expect(await fs.exists("/nope.txt")).toBe(false);
  });

  it("greps on the box and maps hits back to project-relative paths", async () => {
    const { fs } = make({ "/a.txt": "one\ntwo\nthree" });
    expect(await fs.search("two")).toEqual([{ path: "/a.txt", line: 2, text: "two" }]);
  });
});

describe("edit semantics are identical on both filesystems", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  /** Run one scenario against both implementations and compare. */
  async function bothAgree(
    initial: Record<string, string>,
    act: (fs: ProjectFs) => Promise<unknown>
  ) {
    const memory = new InMemoryProjectFs(
      Object.entries(initial).map(([path, content]) => ({ path, content }))
    );
    const memoryResult = await act(memory);
    const memoryFiles = await memory.changedFiles();

    const d = stubDaemon(initial);
    installFetch(d.handler);
    const sandbox = new SandboxProjectFs({ baseUrl: "http://sandbox:2280", projectDir: PROJECT_DIR });
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
