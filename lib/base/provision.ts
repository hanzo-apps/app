/**
 * Provision a project's Base backend from its SQL schema.
 *
 * The builder describes a generated app's data model as SQL DDL (CREATE TABLE …,
 * the same string stored in BackendFeatures.databaseSchema and edited in the
 * Schema tab). To give that app a persistent, IAM-native backend we translate
 * each table into a Base collection. This is intentionally a one-way, additive
 * sync: collections that already exist are left untouched.
 */

import { BaseClient, BaseField, BaseError } from './client';
import { logger } from '@/lib/utils';

export interface ProvisionBaseResult {
  created: string[];
  existing: string[];
  failed: Array<{ collection: string; error: string }>;
}

// Reserved field names Base manages itself; we never re-declare them.
const RESERVED = new Set(['id', 'created', 'updated']);

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

interface ParsedColumn {
  name: string;
  type: string;
  notNull: boolean;
}

interface ParsedTable {
  name: string;
  columns: ParsedColumn[];
}

/**
 * Parse CREATE TABLE statements out of a DDL string. Deliberately small — it
 * understands the column shapes the builder emits (name, type, NOT NULL,
 * PRIMARY KEY, DEFAULT …) and skips table-level constraints.
 */
export function parseDDL(ddl: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  const stmtRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?["'`]?(\w+)["'`]?\s*\(([\s\S]*?)\)\s*;/gi;

  let m: RegExpExecArray | null;
  while ((m = stmtRe.exec(ddl)) !== null) {
    const name = m[1];
    const body = m[2];
    const columns: ParsedColumn[] = [];

    for (const rawLine of splitColumns(body)) {
      const line = rawLine.trim();
      if (!line) continue;
      // Skip table-level constraints.
      if (/^(primary|foreign|unique|check|constraint)\b/i.test(line)) continue;

      const colMatch = line.match(/^["'`]?(\w+)["'`]?\s+([a-zA-Z]+(?:\s*\(\d+(?:,\s*\d+)?\))?)/);
      if (!colMatch) continue;

      const colName = colMatch[1];
      if (RESERVED.has(colName.toLowerCase())) continue;

      columns.push({
        name: colName,
        type: colMatch[2],
        notNull: /\bnot\s+null\b/i.test(line),
      });
    }

    tables.push({ name, columns });
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

/** Convert a parsed table into the Base collection create payload. */
export function tableToCollection(table: ParsedTable): { name: string; fields: BaseField[] } {
  const fields: BaseField[] = table.columns.map((col) => ({
    name: col.name,
    type: sqliteTypeToBaseType(col.type),
    required: col.notNull,
  }));
  return { name: table.name, fields };
}

/**
 * Provision (additively sync) the collections described by `ddl` into Base.
 * Existing collections are kept; only missing ones are created.
 */
export async function provisionBaseFromDDL(client: BaseClient, ddl: string): Promise<ProvisionBaseResult> {
  const result: ProvisionBaseResult = { created: [], existing: [], failed: [] };

  const tables = parseDDL(ddl);
  if (tables.length === 0) return result;

  const existing = new Set<string>();
  try {
    const list = await client.listCollections();
    for (const c of list.items) existing.add(c.name);
  } catch (err) {
    logger.warn('[Base provision] could not list existing collections:', err);
  }

  for (const table of tables) {
    if (existing.has(table.name)) {
      result.existing.push(table.name);
      continue;
    }
    try {
      const payload = tableToCollection(table);
      await client.createCollection(payload);
      result.created.push(table.name);
    } catch (err) {
      const message = err instanceof BaseError ? err.message : String(err);
      result.failed.push({ collection: table.name, error: message });
    }
  }

  return result;
}
