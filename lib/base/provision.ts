/**
 * Provision a generated app's Base backend from its SQL schema.
 *
 * The builder describes a generated app's data model as SQL DDL (CREATE TABLE …,
 * the string in BackendFeatures.databaseSchema, edited in the Schema tab). To
 * give that app a persistent, IAM-native backend we translate each table into a
 * Hanzo Base collection. Additive and idempotent: existing collections are left
 * untouched. Acts as the signed-in user via @hanzo/base (lib/base.ts baseAs).
 */

import type { BaseClient } from '@hanzo/base';

export interface ProvisionBaseResult {
  created: string[];
  existing: string[];
  failed: Array<{ collection: string; error: string }>;
  /**
   * Set when the credential may not write schema AT ALL. That is ONE fact about
   * the request, so it is reported once — not copied into `failed` per table,
   * where N identical permission errors read like N flaky tables and invite a
   * retry that cannot ever succeed.
   */
  refused?: string;
}

/**
 * The HTTP status an upstream error carries, or 0. Read structurally rather
 * than by class identity: the same shape reaches here from `BaseClientError`
 * and from a plain fetch rejection, and only the number is being asked for.
 */
function statusOf(err: unknown): number {
  const s = (err as { status?: unknown } | null)?.status;
  return typeof s === 'number' ? s : 0;
}

/**
 * Whether a status means "this credential may not do this", as opposed to
 * "this particular table did not take".
 *
 * Base binds its whole `/v1/collections` group with `RequireSuperuserAuth`, and
 * an IAM identity resolves to the `_superusers` collection only for a Hanzo
 * platform SuperAdmin — so for every customer credential this refusal is
 * structural and permanent, not transient. Naming it is the difference between
 * "your backend could not be created, here is why" and a pile of per-table
 * errors that look like an outage.
 */
function refusalOf(err: unknown): string | undefined {
  switch (statusOf(err)) {
    case 401:
      return 'Base did not accept this session. Sign in again, then retry.';
    case 403:
      return 'This account may not create Base collections: schema is declared state, ' +
        'applied by the cloud on the project\'s behalf, not writable with a user credential.';
    default:
      return undefined;
  }
}

interface BaseField {
  name: string;
  type: 'text' | 'number' | 'bool' | 'date' | 'json';
  required?: boolean;
}

// Reserved field names Base manages itself; never re-declared.
const RESERVED = new Set(['id', 'created', 'updated', 'owner', 'org']);

/** Map a SQLite column type to the closest Base field type. */
export function sqliteTypeToBaseType(sqlType: string): BaseField['type'] {
  const t = sqlType.toLowerCase();
  if (t.includes('int')) return 'number';
  if (t.includes('real') || t.includes('floa') || t.includes('doub') || t.includes('num') || t.includes('dec')) return 'number';
  if (t.includes('bool')) return 'bool';
  if (t.includes('date') || t.includes('time')) return 'date';
  if (t.includes('json') || t.includes('blob')) return 'json';
  return 'text';
}

interface ParsedTable {
  name: string;
  /** True when the DDL carries an `@public` marker → anonymous form submit. */
  public: boolean;
  columns: Array<{ name: string; type: string; notNull: boolean }>;
}

/**
 * Parse CREATE TABLE statements out of a DDL string. Small by design — it
 * understands the column shapes the builder emits (name, type, NOT NULL,
 * PRIMARY KEY, DEFAULT …) and skips table-level constraints.
 */
export function parseDDL(ddl: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  const stmtRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?["'`]?(\w+)["'`]?\s*\(([\s\S]*?)\)\s*;/gi;

  let m: RegExpExecArray | null;
  while ((m = stmtRe.exec(ddl)) !== null) {
    const columns: ParsedTable['columns'] = [];
    for (const rawLine of splitColumns(m[2])) {
      const line = rawLine.trim();
      if (!line) continue;
      if (/^(primary|foreign|unique|check|constraint)\b/i.test(line)) continue;

      const colMatch = line.match(/^["'`]?(\w+)["'`]?\s+([a-zA-Z]+(?:\s*\(\d+(?:,\s*\d+)?\))?)/);
      if (!colMatch) continue;
      if (RESERVED.has(colMatch[1].toLowerCase())) continue;

      columns.push({
        name: colMatch[1],
        type: colMatch[2],
        notNull: /\bnot\s+null\b/i.test(line),
      });
    }
    // PUBLIC FORM (anonymous submit allowed) when the CREATE TABLE carries an
    // `@public` marker comment (e.g. a `-- @public` line inside it).
    const isPublic = /@public\b/i.test(m[0]);
    tables.push({ name: m[1], public: isPublic, columns });
  }
  return tables;
}

/** Split a CREATE TABLE body on top-level commas (ignoring those inside parens). */
function splitColumns(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of body) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function tableToFields(table: ParsedTable): BaseField[] {
  const fields: BaseField[] = table.columns.map((col) => ({
    name: col.name,
    type: sqliteTypeToBaseType(col.type),
    required: col.notNull,
  }));
  // System-managed tenant columns — stamped from the verified IAM principal by
  // Base's create hook (the client cannot set them). `org` is the tenant key the
  // org-scoped rules enforce isolation on; `owner` is provenance.
  fields.push({ name: 'owner', type: 'text' });
  fields.push({ name: 'org', type: 'text' });
  return fields;
}

/**
 * Provision (additively) the collections described by `ddl` into Base, acting
 * as the signed-in user. Existing collections are kept; only missing ones are
 * created, with authenticated-only rules (private by default).
 */
export async function provisionBaseFromDDL(client: BaseClient, ddl: string): Promise<ProvisionBaseResult> {
  const result: ProvisionBaseResult = { created: [], existing: [], failed: [] };

  const tables = parseDDL(ddl);
  if (tables.length === 0) return result;

  const existing = new Set<string>();
  try {
    const list = await client.send<{ items: Array<{ name: string }> }>('/v1/collections', {
      method: 'GET',
      query: { perPage: '200' },
    });
    for (const c of list.items ?? []) existing.add(c.name);
  } catch (err) {
    // A REFUSED list is the same refusal every create is about to hit, so stop
    // here and say so once. Any other listing failure is not decisive — the
    // creates still run and duplicate-name errors are caught per table.
    const refused = refusalOf(err);
    if (refused) return { ...result, refused };
  }

  // Team-shared, tenant-isolated: any member of the caller's IAM org can read/
  // write the org's rows; other orgs cannot see them. `@request.auth.org_id` is
  // the verified IAM org on the auth record (Base stamps it from the JWT once the
  // users collection carries the org_id field — base migration 1780600000).
  const orgScope = '@request.auth.org_id = org';

  for (const table of tables) {
    if (existing.has(table.name)) {
      result.existing.push(table.name);
      continue;
    }
    try {
      await client.send('/v1/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: table.name,
          type: 'base',
          fields: tableToFields(table),
          listRule: orgScope,
          viewRule: orgScope,
          // Public form → anonymous create ("" = anyone). Otherwise authenticated
          // create. Either way Base's hook stamps owner+org from the principal, so
          // isolation holds regardless of who created the row.
          createRule: table.public ? '' : "@request.auth.id != ''",
          updateRule: orgScope,
          deleteRule: orgScope,
        }),
      });
      result.created.push(table.name);
    } catch (err) {
      // Same rule as the listing: a permission refusal is about the credential,
      // not about this table, so it stops the loop instead of being repeated
      // once per remaining table.
      const refused = refusalOf(err);
      if (refused) return { ...result, refused };
      result.failed.push({ collection: table.name, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return result;
}
