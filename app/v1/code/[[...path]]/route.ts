/**
 * /v1/code[/...] — the org-scoped code-intelligence BFF.
 *
 * Surface (proxied verbatim to cloud /v1/code):
 *   GET  /v1/code            index status for the org
 *   GET  /v1/code/search     hybrid retrieval (lexical + symbolic + semantic, RRF-fused)
 *   GET  /v1/code/context    the chunks an agent should read for a question
 *   GET  /v1/code/tree       repository tree
 *   GET  /v1/code/file       one file's contents
 *   POST /v1/code/ask        ask over the indexed corpus
 *   POST /v1/code/index      (re)index a repository
 *
 * Cloud keeps ONE SQLite file per org, so the org boundary is physical — a query
 * in one org's file cannot reach another's. This route only carries the caller's
 * bearer through; the scope is derived from its owner claim, never from input.
 */
import { bffRoutes } from '@/lib/org/bff';

export const runtime = 'nodejs';

const h = bffRoutes({ prefix: '/v1/code' });
export const GET = h.GET;
export const POST = h.POST;
