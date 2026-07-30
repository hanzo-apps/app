/**
 * /v1/skills[/...] — the org-scoped skills BFF.
 *
 * Surface (proxied verbatim to cloud /v1/skills):
 *   GET    /v1/skills            the org's skill registry (brand + own, activation flags)
 *   POST   /v1/skills            add or revise one of the org's own skills
 *   GET    /v1/skills/authored   the org's own skills, with their SKILL.md bodies
 *   DELETE /v1/skills/:id        remove one of the org's own skills
 *
 * The brand's skills are embedded in cloud and read-only here; a POST only ever
 * writes the org's private set. Guards, identity and pass-through are the shared
 * forwarder's (lib/org/bff.ts).
 */
import { bffRoutes } from '@/lib/org/bff';

export const runtime = 'nodejs';

const h = bffRoutes({ prefix: '/v1/skills' });
export const GET = h.GET;
export const POST = h.POST;
export const DELETE = h.DELETE;
