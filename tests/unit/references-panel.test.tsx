/**
 * The references panel: the gallery, and the removal that is the point of it.
 *
 * What these hold is that nothing derived is permanent and every removal says
 * what it takes with it — a person has to be able to delete a wrong concept
 * WITHOUT deleting the photo that suggested it, and delete a photo knowing its
 * unsupported concepts go too.
 */
import { fireEvent, render as bare, screen, waitFor } from "@testing-library/react";

import { References } from "@/components/references";
import { WithGui } from "../gui-wrapper";

// References renders @hanzo/gui primitives, which read a createGui config at
// render and throw "Missing hanzogui config" without one. The app mounts it once
// in app/providers.tsx — see tests/gui-wrapper.
const render = (ui: React.ReactElement) => bare(ui, { wrapper: WithGui });

const brand = {
  colors: [{ hex: "#112233", name: "deep navy", from: ["a1"] }],
  themes: [{ text: "coastal", from: ["a1", "a2"] }],
  concepts: [{ text: "driftwood", from: ["a1"] }],
  updated: "2026-08-04T00:00:00Z",
};

const assets = [
  { id: "a1", name: "beach.jpg", kind: "drive", mode: "brand", url: "u1", origin: "o" },
  { id: "a2", name: "shell.jpg", kind: "drive", mode: "gallery", url: "u2", origin: "o" },
];

function mockFetch(impl?: (url: string, init?: RequestInit) => unknown) {
  const calls: { url: string; init?: RequestInit }[] = [];
  global.fetch = ((url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const body = impl?.(url, init) ?? { ok: true, assets, brand };
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  }) as unknown as typeof fetch;
  return calls;
}

test("references — asks for a project before anything else", () => {
  mockFetch();
  render(<References project={null} />);
  expect(screen.getByText(/Open a project/i)).toBeTruthy();
});

test("references — both modes are offered, in the person's own terms", async () => {
  mockFetch();
  render(<References project="me/app" />);
  await waitFor(() => expect(screen.getByText("Use in the app")).toBeTruthy());
  // The distinction is stated, not implied by a label.
  expect(screen.getByText(/put them in the app's gallery/i)).toBeTruthy();
  expect(screen.getByText(/won't appear in the app/i)).toBeTruthy();
});

test("references — each tile says which mode it came in under", async () => {
  mockFetch();
  render(<References project="me/app" />);
  await waitFor(() => expect(screen.getByText("inspiration")).toBeTruthy());
  expect(screen.getByText("in app")).toBeTruthy();
});

test("references — removing a concept does NOT remove its image", async () => {
  const calls = mockFetch();
  render(<References project="me/app" />);
  await waitFor(() => expect(screen.getByLabelText(/Remove concept driftwood/i)).toBeTruthy());

  fireEvent.click(screen.getByLabelText(/Remove concept driftwood/i));

  const del = calls.find((c) => c.url.includes("/brand?field=concepts"));
  expect(del).toBeTruthy();
  expect(del?.init?.method).toBe("DELETE");
  expect(decodeURIComponent(del!.url)).toContain("value=driftwood");
  // The asset endpoint was never touched — the photo was probably right about
  // everything else.
  expect(calls.some((c) => c.url.includes("/assets?id="))).toBe(false);
});

test("references — removing an image goes through the assets endpoint", async () => {
  const calls = mockFetch();
  render(<References project="me/app" />);
  await waitFor(() => expect(screen.getByLabelText(/Remove beach.jpg/i)).toBeTruthy());

  fireEvent.click(screen.getByLabelText(/Remove beach.jpg/i));
  const del = calls.find((c) => c.url.includes("/assets?id=a1"));
  expect(del?.init?.method).toBe("DELETE");
});

test("references — a colour can be removed by its own control", async () => {
  const calls = mockFetch();
  render(<References project="me/app" />);
  await waitFor(() => expect(screen.getByLabelText(/Remove color deep navy/i)).toBeTruthy());
  fireEvent.click(screen.getByLabelText(/Remove color deep navy/i));
  expect(calls.some((c) => c.url.includes("field=colors"))).toBe(true);
});

test("references — the server's own reason is shown, not a generic failure", async () => {
  mockFetch((url, init) =>
    init?.method === "POST" && url.endsWith("/assets")
      ? { ok: false, error: "Connect Google first, then import from Drive." }
      : { ok: true, assets, brand }
  );
  render(<References project="me/app" />);
  await waitFor(() => expect(screen.getByLabelText(/Pinterest board or Google Drive/i)).toBeTruthy());

  fireEvent.change(screen.getByLabelText(/Pinterest board or Google Drive/i), {
    target: { value: "https://drive.google.com/drive/folders/1" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Import/i }));

  // "Connect Google" is something a person can act on; "failed" is not.
  await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Connect Google first/));
});
