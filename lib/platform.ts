// Server-side Hanzo Platform (PaaS) client.
//
// Binds hanzo.app's builder to the cloud /v1/platform control plane — the ONE
// deploy path: projects → applications → deploy → operator `Service` CR in the
// caller's own tenant-<org> namespace, reconciled by the Hanzo operator.
//
// IAM-native, per-org, fail-closed:
//   Every call is made AS the logged-in user by forwarding that user's IAM
//   access token (from getUserSession()). /v1/platform derives the tenant org
//   from the token owner — the builder never sends an org, so a user can only
//   ever build/deploy into their own namespace. There is NO shared service key
//   in this surface. A call with no user token fails closed.
//
// This module REIMPLEMENTS nothing. It does not talk to Kubernetes, launch
// builds, or write CRs — it forwards to /v1/platform, which owns the build
// (arcd BuildKit) + deploy (operator) mechanics. The builder BINDS to the
// control plane; it is not a second control plane.

const PLATFORM_API_URL =
  process.env.HANZO_PLATFORM_API_URL ||
  process.env.HANZO_CLOUD_API_URL ||
  'https://api.cloud.hanzo.ai';

/** Base for the per-org PaaS control plane. */
export const PLATFORM_BASE = `${PLATFORM_API_URL.replace(/\/+$/, '')}/v1/platform`;

/** Thrown when a call is attempted without a user IAM token (fail-closed). */
export class PlatformAuthError extends Error {
  constructor() {
    super('Platform requires an authenticated user (no IAM token)');
    this.name = 'PlatformAuthError';
  }
}

/** Thrown for a non-2xx response; carries the upstream status + body. */
export class PlatformError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Platform API error (${status}): ${body}`);
    this.name = 'PlatformError';
  }
}

// ── the ONE request primitive (mirrors lib/commerce.ts) ──────────────────────

/**
 * Make a /v1/platform request AS the given user. `token` is the user's IAM
 * access token, forwarded verbatim as the bearer so the control plane
 * attributes the request — and derives the tenant org — from that identity.
 */
async function platformRequest<T = unknown>(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  if (!token) throw new PlatformAuthError();

  const res = await fetch(`${PLATFORM_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!res.ok) throw new PlatformError(res.status, text);
  return (text ? JSON.parse(text) : undefined) as T;
}

// ── contract types (mirror the /v1/platform result shapes) ───────────────────

export interface PlatformProject {
  id: string;
  org: string;
  slug: string;
  name: string;
  description?: string;
  applications: number;
  createdAt: number;
  updatedAt: number;
}

export interface PlatformApp {
  id: string;
  org: string;
  projectId: string;
  slug: string;
  name: string;
  environment: string;
  source: 'git' | 'image';
  repo: { url?: string; branch?: string; provider?: string };
  image: { repository?: string; tag?: string };
  buildType?: string;
  dockerfile?: string;
  env: Array<{ key: string; value: string; secret: boolean }>;
  port: number;
  replicas: number;
  domains: string[];
  status: string;
  namespace?: string;
  currentDeploymentId?: string;
  phase?: string;
  health?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlatformDeployment {
  id: string;
  org: string;
  applicationId: string;
  version: number;
  status: string;
  source: string;
  commit?: string;
  image?: string;
  buildId?: string;
  message?: string;
  createdAt: number;
  updatedAt: number;
}

// ── typed helpers ────────────────────────────────────────────────────────────

export const listProjects = (token: string) =>
  platformRequest<PlatformProject[]>(token, 'GET', '/projects');

export const getProject = (token: string, project: string) =>
  platformRequest<PlatformProject>(token, 'GET', `/projects/${encodeURIComponent(project)}`);

export const createProject = (
  token: string,
  input: { name: string; slug?: string; description?: string },
) => platformRequest<PlatformProject>(token, 'POST', '/projects', input);

export const listApps = (token: string, project: string) =>
  platformRequest<PlatformApp[]>(token, 'GET', `/projects/${encodeURIComponent(project)}/apps`);

export const getApp = (token: string, project: string, app: string) =>
  platformRequest<PlatformApp>(
    token,
    'GET',
    `/projects/${encodeURIComponent(project)}/apps/${encodeURIComponent(app)}`,
  );

/** The shape the builder hands us for the app to create/deploy. */
export interface AppSpec {
  name: string;
  slug?: string;
  source: 'git' | 'image';
  repo?: { url: string; branch?: string };
  image?: { repository: string; tag?: string };
  buildType?: string;
  dockerfile?: string;
  port?: number;
  replicas?: number;
  env?: Array<{ key: string; value: string; secret?: boolean }>;
  domains?: string[];
}

export const createApp = (token: string, project: string, spec: AppSpec) =>
  platformRequest<PlatformApp>(
    token,
    'POST',
    `/projects/${encodeURIComponent(project)}/apps`,
    spec,
  );

export const deployApp = (
  token: string,
  project: string,
  app: string,
  body?: { commit?: string; tag?: string },
) =>
  platformRequest<PlatformDeployment>(
    token,
    'POST',
    `/projects/${encodeURIComponent(project)}/apps/${encodeURIComponent(app)}/deploy`,
    body ?? {},
  );

export const listDeployments = (token: string, project: string, app: string) =>
  platformRequest<PlatformDeployment[]>(
    token,
    'GET',
    `/projects/${encodeURIComponent(project)}/apps/${encodeURIComponent(app)}/deployments`,
  );

// ── orchestration: the "Deploy" one-shot ─────────────────────────────────────

export interface DeployInput {
  project: { name: string; slug?: string; description?: string };
  app: AppSpec;
  /** Optional deploy overrides (git commit / image tag). */
  deploy?: { commit?: string; tag?: string };
}

export interface DeployResult {
  project: PlatformProject;
  app: PlatformApp;
  deployment: PlatformDeployment;
  /** Public URL when a verified domain is attached, else null (build/deploy still runs). */
  url: string | null;
}

/** getOrCreate a project by slug — idempotent so a re-deploy reuses it. */
async function ensureProject(
  token: string,
  input: { name: string; slug?: string; description?: string },
): Promise<PlatformProject> {
  const slug = input.slug || slugify(input.name);
  try {
    return await getProject(token, slug);
  } catch (err) {
    if (err instanceof PlatformError && err.status === 404) {
      return createProject(token, { ...input, slug });
    }
    throw err;
  }
}

/** getOrCreate an application by slug within a project (idempotent re-deploy). */
async function ensureApp(
  token: string,
  project: string,
  spec: AppSpec,
): Promise<PlatformApp> {
  const slug = spec.slug || slugify(spec.name);
  try {
    return await createApp(token, project, { ...spec, slug });
  } catch (err) {
    if (err instanceof PlatformError && err.status === 409) {
      return getApp(token, project, slug);
    }
    throw err;
  }
}

/**
 * The builder's "Deploy" path: ensure the project + application exist, then
 * trigger a deploy. For source=git this launches a BuildKit build (the
 * deployment lands "building"); for source=image it applies the CR immediately.
 * Everything is org-scoped by the forwarded token — the builder never names an
 * org or namespace.
 */
export async function deploy(token: string, input: DeployInput): Promise<DeployResult> {
  const project = await ensureProject(token, input.project);
  const app = await ensureApp(token, project.slug, input.app);
  const deployment = await deployApp(token, project.slug, app.slug, input.deploy);
  return { project, app, deployment, url: appURL(app) };
}

/**
 * Register a git-source Application that tracks `repo` so the cloud's native
 * `git push → build → deploy` CD fires on every push — and seed the FIRST build.
 *
 * Ordering matters: the caller PUSHES first, then calls this. The cloud matches a
 * push to an Application by comparing `Application.RepoURL` to the push CloneURL as
 * an exact string, so:
 *   • First publish — the app didn't exist yet, so that push matched nothing (no
 *     build). We CREATE the app here and kick the initial deploy once.
 *   • Every later publish — the app already exists, so the push ITSELF fired the
 *     build (buildFromPush). We create-or-get, see 409, and do NOT call deployApp
 *     again — no double build.
 * That keeps the git push as the ONE build trigger, with a single manual kick only
 * to seed the very first deploy.
 *
 * `repo.url` MUST be the verbatim clone URL the push returned (the api.hanzo.ai
 * form) — a reconstructed URL risks never matching the push CloneURL.
 */
export async function ensureAppForPush(
  token: string,
  input: {
    project: { name: string; slug?: string; description?: string };
    app: { name: string; slug?: string };
    repo: { url: string; branch?: string };
  },
): Promise<{
  project: PlatformProject;
  app: PlatformApp;
  created: boolean;
  deployment: PlatformDeployment | null;
}> {
  const project = await ensureProject(token, input.project);
  const slug = input.app.slug || slugify(input.app.name);
  const spec: AppSpec = {
    name: input.app.name,
    slug,
    source: 'git',
    // hanzoai/pack (the zero-config BuildKit frontend) detects static sites AND
    // every buildable framework, so ONE build type covers all published apps.
    buildType: 'pack',
    repo: { url: input.repo.url, branch: input.repo.branch || 'main' },
  };
  try {
    const app = await createApp(token, project.slug, spec);
    // Newly created ⇒ the push that just happened predated this app and matched
    // nothing; seed the first build (best-effort — the repo is already pushed).
    const deployment = await deployApp(token, project.slug, app.slug).catch(() => null);
    return { project, app, created: true, deployment };
  } catch (err) {
    if (err instanceof PlatformError && err.status === 409) {
      // Already tracked ⇒ the push already fired the CD build; do NOT double-build.
      const app = await getApp(token, project.slug, slug);
      return { project, app, created: false, deployment: null };
    }
    throw err;
  }
}

/** Live status of an app + its latest deployment, for the builder's status panel. */
export async function deployStatus(token: string, project: string, app: string) {
  const [appView, deployments] = await Promise.all([
    getApp(token, project, app),
    listDeployments(token, project, app).catch(() => [] as PlatformDeployment[]),
  ]);
  return {
    app: appView,
    latestDeployment: deployments[0] ?? null,
    phase: appView.phase ?? null,
    health: appView.health ?? null,
    url: appURL(appView),
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

/** Public URL for an app: its first attached domain, else null. */
function appURL(app: PlatformApp): string | null {
  return app.domains && app.domains.length > 0 ? `https://${app.domains[0]}` : null;
}

/** Local, lossless slug derivation matching the control plane's slug rule. */
function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/^-+|-+$/g, '');
  return s || 'app';
}
