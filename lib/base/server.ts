/**
 * Server-side Base helpers.
 *
 * Resolves the caller's Hanzo IAM token (Authorization header first, then the
 * hanzo_token session cookie) and hands back a BaseClient bound to it. Used by
 * the /api/base/* proxy and any server route that reads/writes Base on behalf
 * of the signed-in user.
 */

import 'server-only';
import { cookies, headers } from 'next/headers';
import { BaseClient } from './client';
import { isBaseConfigured } from './config';

const COOKIE_NAME = 'hanzo_token';

/** Extract the raw IAM access token from the current request, if present. */
export async function resolveIamToken(): Promise<string | undefined> {
  const h = await headers();
  const authHeader = h.get('authorization') || h.get('Authorization');
  if (authHeader) {
    return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  }
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/**
 * Build a BaseClient for the current request. Returns null when Base is
 * unconfigured or the request is unauthenticated, so callers can map those to
 * 503 / 401 respectively.
 */
export async function baseClientForRequest(): Promise<BaseClient | null> {
  if (!isBaseConfigured()) return null;
  const token = await resolveIamToken();
  if (!token) return null;
  return new BaseClient(token);
}
