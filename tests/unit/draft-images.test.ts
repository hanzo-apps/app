/**
 * @jest-environment node
 */

/**
 * Attaching an image to a project that has not been published.
 *
 * The builder used to refuse: "Publish your project first to attach reference
 * images." Two things were wrong with that, and the second is why publishing
 * would not have helped.
 *
 * 1. The row it was really waiting for is this app's own note about a project,
 *    and NOTHING wrote one. Publishing goes to the cloud projects service; the
 *    only other writer demanded an existing published static space. So the
 *    condition was unreachable by the action the message named.
 * 2. The bytes were committed into that published space with `user.token` as the
 *    access token — a hanzo.id IAM JWT, offered to huggingface.co, which cannot
 *    authenticate. Past the gate there was no working upload behind it.
 *
 * So the row is now made on demand and the bytes live in Base. What is pinned
 * here is the whole path an unpublished project takes: no row, upload, a durable
 * URL back, and a second upload that reuses the row rather than making another.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// ── A Base standing in for the data plane ────────────────────────────────────
// Rows in a Map, filters read the way lib/db writes them (`k='v' && k='v'`).

type Row = Record<string, unknown> & { id: string };

const rows = new Map<string, Row[]>();
const creates: string[] = [];

const of = (name: string) => {
  if (!rows.has(name)) rows.set(name, []);
  return rows.get(name)!;
};

const matches = (row: Row, filter: string) =>
  [...filter.matchAll(/(\w+)='([^']*)'/g)].every(([, k, v]) => row[k] === v);

/** FormData or a plain object, flattened to a row. A File keeps its name. */
const fields = (data: unknown): Record<string, unknown> => {
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of data as unknown as Iterable<[string, unknown]>) {
      out[k] = v instanceof File ? v.name : v;
    }
    return out;
  }
  return data as Record<string, unknown>;
};

const collection = (name: string) => ({
  async getFirstListItem(filter: string) {
    const found = of(name).find((r) => matches(r, filter));
    if (!found) throw new Error("not found");
    return found;
  },
  async getList() {
    return { items: of(name) };
  },
  async create(data: unknown) {
    creates.push(name);
    const row = { id: `${name}-${of(name).length + 1}`, ...fields(data) } as Row;
    of(name).push(row);
    return row;
  },
  async update(id: string, data: unknown) {
    const row = of(name).find((r) => r.id === id)!;
    Object.assign(row, fields(data));
    return row;
  },
  async delete() {
    return true;
  },
});

jest.mock("@/lib/base", () => ({
  baseUrl: () => "http://base.test",
  isBaseConfigured: () => true,
  baseAs: () => ({ collection }),
}));

jest.mock("@/lib/iam", () => ({
  session: async () => ({ token: "a-verified-iam-token", sub: "u_1", name: "z" }),
}));
jest.mock("@/lib/org/csrf", () => ({ requireSameOrigin: () => null }));

import { NextRequest } from "next/server";

import { POST } from "@/app/v1/me/projects/[namespace]/[repoId]/images/route";
import { ensureProject, getProject } from "@/lib/db/projects";
import { fileName, imageUrl, refuse, stored, MAX_IMAGE_BYTES } from "@/lib/db/images";

const DRAFT = "maxpower/draft-9f2c1a";
const ctx = { params: Promise.resolve({ namespace: "maxpower", repoId: "draft-9f2c1a" }) };

const png = (name = "shot.png", bytes = 8) =>
  new File([new Uint8Array(bytes)], name, { type: "image/png" });

/** One upload of `files` to the draft, as the builder sends it. */
async function upload(...files: File[]) {
  const body = new FormData();
  for (const f of files) body.append("images", f);
  const res = await POST(
    new NextRequest("https://hanzo.app/v1/me/projects/maxpower/draft-9f2c1a/images", {
      method: "POST",
      body: body as unknown as BodyInit,
    }),
    ctx
  );
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

beforeEach(() => {
  rows.clear();
  creates.length = 0;
});

describe("the project row is made on demand", () => {
  test("a draft has none, and asking for it creates one", async () => {
    assert.equal(await getProject("t", "u_1", DRAFT), null);

    const made = await ensureProject("t", "u_1", DRAFT);
    assert.equal(made?.space_id, DRAFT);
    assert.equal(made?.user_id, "u_1");
    assert.equal(creates.filter((c) => c === "projects").length, 1);
  });

  test("asking twice reuses the row rather than making a second", async () => {
    const first = await ensureProject("t", "u_1", DRAFT);
    const second = await ensureProject("t", "u_1", DRAFT);

    assert.equal(first?.id, second?.id);
    assert.equal(creates.filter((c) => c === "projects").length, 1);
  });

  test("one user's row is never another's", async () => {
    await ensureProject("t", "u_1", DRAFT);
    assert.equal(await getProject("t", "u_2", DRAFT), null);
  });
});

describe("uploading to an unpublished project", () => {
  test("the first upload succeeds and answers with durable URLs", async () => {
    const { status, body } = await upload(png());

    assert.equal(status, 200);
    const urls = body.uploadedFiles as string[];
    assert.equal(urls.length, 1);
    // Absolute, because a published page embeds it and is served from another
    // host; and under /v1/images so the bytes route can serve it back.
    assert.match(urls[0], /^https:\/\/hanzo\.app\/v1\/images\/[^/]+\/shot\.png$/);
    assert.equal(stored(urls[0]), true);

    // The row it needed did not exist before this request.
    assert.equal(creates.filter((c) => c === "projects").length, 1);
    assert.equal(creates.filter((c) => c === "images").length, 1);
  });

  test("a second upload reuses the row and adds only the image", async () => {
    await upload(png("one.png"));
    await upload(png("two.png"));

    assert.equal(creates.filter((c) => c === "projects").length, 1);
    assert.equal(creates.filter((c) => c === "images").length, 2);
  });

  test("no bytes at all is the caller's mistake, not a stored empty", async () => {
    const { status, body } = await upload();
    assert.equal(status, 400);
    assert.equal(body.ok, false);
  });

  test("one bad file does not cost the good ones", async () => {
    const pdf = new File([new Uint8Array(4)], "notes.pdf", { type: "application/pdf" });
    const { status, body } = await upload(png("good.png"), pdf);

    assert.equal(status, 200);
    assert.equal((body.uploadedFiles as string[]).length, 1);
    assert.match((body.rejected as string[])[0], /notes\.pdf is not an image/);
  });

  test("when nothing can be stored the reasons come back, not a bare success", async () => {
    const pdf = new File([new Uint8Array(4)], "notes.pdf", { type: "application/pdf" });
    const { status, body } = await upload(pdf);

    assert.equal(status, 400);
    assert.match(String(body.error), /not an image/);
  });
});

describe("what a stored image is called", () => {
  test("the extension comes from the bytes, not from the claimed name", () => {
    assert.equal(fileName(new File([], "photo.png", { type: "image/jpeg" })), "photo.jpg");
    assert.equal(fileName(new File([], "art.webp", { type: "image/webp" })), "art.webp");
  });

  test("a name that could escape the path cannot", () => {
    const named = fileName(new File([], "../../etc/passwd.png", { type: "image/png" }));
    // One dot, and it is the extension: no separators and no traversal survive.
    assert.equal(named.split(".").length, 2);
    assert.equal(named.endsWith(".png"), true);
    assert.equal(/[/\\]/.test(named), false);
  });

  test("an image too large to keep says so before it is sent", () => {
    const huge = new File([], "huge.png", { type: "image/png" });
    Object.defineProperty(huge, "size", { value: MAX_IMAGE_BYTES + 1 });
    assert.match(refuse(huge), /larger than 5MB/);
    assert.equal(refuse(png()), "");
  });

  test("an imported image is only 'stored' once the bytes are ours", () => {
    assert.equal(stored("https://i.pinimg.com/originals/a.jpg"), false);
    assert.equal(stored(imageUrl("https://hanzo.app", "abc", "a.jpg")), true);
  });
});

describe("the refusal itself is gone", () => {
  const composer = readFileSync("components/editor/ask-ai/index.tsx", "utf8");
  const uploader = readFileSync("components/editor/ask-ai/uploader.tsx", "utf8");

  test("neither the drop/paste path nor the picker asks anyone to publish first", () => {
    assert.equal(composer.includes("Publish your project first"), false);
    assert.equal(uploader.includes("Publish your project first"), false);
  });

  test("and neither decides what to render from whether a space id exists", () => {
    assert.equal(uploader.includes("project?.space_id ?"), false);
    assert.equal(composer.includes("if (!project?.space_id)"), false);
  });
});

describe("nothing here still uploads to a Hugging Face space", () => {
  test("the image paths carry no @huggingface/hub import", () => {
    for (const file of [
      "app/v1/me/projects/[namespace]/[repoId]/images/route.ts",
      "app/v1/me/projects/[namespace]/[repoId]/assets/bytes/route.ts",
    ]) {
      assert.equal(readFileSync(file, "utf8").includes("@huggingface/hub"), false, file);
    }
  });
});
