/* eslint-disable @typescript-eslint/no-explicit-any */
import { SESSION_COOKIE } from "@hanzo/iam/server";

/**
 * Same-origin browser client for the app's own `/v1/*` surface.
 *
 * The bearer comes from the ONE cookie the IAM provider projects the SDK token
 * onto (`components/providers/IamClientProvider`) — there is no second token
 * store to fall out of sync with. The server verifies whatever arrives against
 * IAM's JWKS regardless, so reading it here only decides whether the call is
 * made as somebody at all.
 *
 * `fetch` is the one HTTP client in this app. A non-2xx rejects with the parsed
 * body attached, so a caller can still branch on what the server actually said.
 */
export class ApiError extends Error {
  readonly response: { status: number; data: any };
  constructor(status: number, data: any) {
    super(`api ${status}`);
    this.response = { status, data };
  }
}

async function send<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ data: T }> {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];

  const res = await fetch(`/v1${path}`, {
    method,
    cache: "no-store",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return { data: data as T };
}

export const api = {
  get: <T = any>(path: string) => send<T>("GET", path),
  post: <T = any>(path: string, body?: unknown) => send<T>("POST", path, body),
  put: <T = any>(path: string, body?: unknown) => send<T>("PUT", path, body),
  patch: <T = any>(path: string, body?: unknown) => send<T>("PATCH", path, body),
  delete: <T = any>(path: string) => send<T>("DELETE", path),
};
