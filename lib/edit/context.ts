/**
 * The Hanzo Edit context trace — shaped ONCE here, reused by `/v1/suggest`
 * (issue body) and `/v1/edit` (PR body).
 *
 * The widget (`public/edit.js`) auto-resolves the source file(s) for the current
 * view and attaches a trace of WHERE + WHAT the user was looking at. This module
 * validates that trace (untrusted client input), renders it into a compact review
 * block, and resolves the effective edit path from the ranked candidates — so a
 * contributor never hand-types a path, and the reviewing agent/dev has enough to
 * finish the fix.
 *
 * Security: everything here is untrusted. Paths run through `safePath`; the
 * replay deep-link is RECONSTRUCTED from the session id (never taken from the
 * client) so no arbitrary link is injected into an issue/PR.
 */
import { safePath } from './flow';

export interface CandidateFile {
  path: string;
  score?: number;
  why?: string;
}

export interface ReplayRef {
  sessionId: string;
  deepLink: string;
}

export interface UsageEvent {
  route: string;
  kind?: string;
}

export interface WidgetContext {
  route?: string;
  candidateFiles: CandidateFile[];
  domBreadcrumb?: string;
  appVersion?: string;
  sessionId?: string;
  replayRef?: ReplayRef;
  usageTrace?: UsageEvent[];
}

const INSIGHTS = 'https://insights.hanzo.ai';

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim().slice(0, max);
  return s || undefined;
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function sessionToken(v: unknown): string | undefined {
  const s = str(v, 128);
  return s && /^[A-Za-z0-9._-]+$/.test(s) ? s : undefined;
}

/** Parse + sanitize the untrusted trace. Always returns a well-formed value. */
export function parseContext(input: Record<string, unknown>): WidgetContext {
  const candidateFiles: CandidateFile[] = [];
  if (Array.isArray(input.candidateFiles)) {
    for (const raw of input.candidateFiles.slice(0, 6)) {
      const o = obj(raw);
      const path = safePath(typeof o.path === 'string' ? o.path : '');
      if (!path) continue;
      const cf: CandidateFile = { path };
      if (typeof o.score === 'number' && isFinite(o.score)) cf.score = Math.max(0, Math.min(1, o.score));
      const why = str(o.why, 60);
      if (why) cf.why = why;
      candidateFiles.push(cf);
    }
  }

  const sessionId = sessionToken(input.sessionId) || sessionToken(obj(input.replayRef).sessionId);
  // Reconstruct the deep-link from the id we trust — never echo a client URL.
  const replayRef: ReplayRef | undefined = sessionId
    ? { sessionId, deepLink: `${INSIGHTS}/replay/${encodeURIComponent(sessionId)}` }
    : undefined;

  const usage: UsageEvent[] = [];
  if (Array.isArray(input.usageTrace)) {
    for (const raw of input.usageTrace.slice(-8)) {
      const o = obj(raw);
      const route = str(o.route, 256);
      if (!route) continue;
      const ev: UsageEvent = { route };
      const kind = str(o.kind, 16);
      if (kind) ev.kind = kind;
      usage.push(ev);
    }
  }

  return {
    route: str(input.route, 512),
    candidateFiles,
    domBreadcrumb: str(input.domBreadcrumb, 500),
    appVersion: str(input.appVersion, 40),
    sessionId,
    replayRef,
    usageTrace: usage.length ? usage : undefined,
  };
}

/** The effective edit path: an explicit path if valid, else the top candidate. */
export function pickPath(explicit: string | undefined, candidates: CandidateFile[]): string | null {
  const direct = safePath(explicit || '');
  if (direct) return direct;
  for (const c of candidates) {
    const p = safePath(c.path);
    if (p) return p;
  }
  return null;
}

/** Render the trace as a compact markdown block for an issue/PR body. */
export function renderContext(ctx: WidgetContext): string {
  const lines: string[] = [];
  const where: string[] = [];
  if (ctx.route) where.push(`- Route: \`${ctx.route}\``);
  if (ctx.appVersion) where.push(`- App version: \`${ctx.appVersion}\``);
  if (ctx.domBreadcrumb) where.push(`- On screen: \`${ctx.domBreadcrumb}\``);
  if (where.length) {
    lines.push('**Where**', ...where);
  }

  if (ctx.candidateFiles.length) {
    lines.push('', '**Candidate files** (ranked, auto-resolved)');
    for (const c of ctx.candidateFiles) {
      const why = c.why ? ` — ${c.why}` : '';
      const score = typeof c.score === 'number' ? ` \`${c.score}\`` : '';
      lines.push(`- \`${c.path}\`${why}${score}`);
    }
  }

  const session: string[] = [];
  if (ctx.sessionId) session.push(`- Session: \`${ctx.sessionId}\``);
  if (ctx.replayRef) {
    session.push(`- Replay: ${ctx.replayRef.deepLink} — _lights up once session-replay ingest is live_`);
  }
  if (ctx.usageTrace && ctx.usageTrace.length) {
    const path = ctx.usageTrace.map((e) => e.route).filter(Boolean).join(' → ');
    if (path) session.push(`- Recent: ${path}`);
  }
  if (session.length) {
    lines.push('', '**Session**', ...session);
  }

  return lines.join('\n');
}
