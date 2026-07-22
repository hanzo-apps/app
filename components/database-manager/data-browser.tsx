'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@hanzo/ui';
import { Input } from '@hanzo/ui';
import {
  Database, Plus, RefreshCw, Trash2, Pencil, X, Loader2, Search, TableProperties,
} from 'lucide-react';

/**
 * Data browser — the native "admin backend for all collections": list every
 * collection, browse its rows, and add / edit / delete records from a UI (no SQL
 * required). Built on the same schema + query endpoints the rest of the manager
 * uses, so it works for a deployment DB (`/api/admin/deployments/<id>/database/*`)
 * or any Base via `schemaEndpoint` / `queryEndpoint` overrides.
 */

interface ColumnInfo {
  name: string;
  type?: string;
  notnull?: boolean;
  pk?: boolean | number;
}
interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  isSystemTable?: boolean;
}
interface QueryResult {
  columns?: string[];
  rows?: unknown[][];
  rowsAffected?: number;
  error?: string;
}

interface DataBrowserProps {
  deploymentId?: string;
  schemaEndpoint?: string;
  queryEndpoint?: string;
}

const PAGE = 200;

/** Safely render a SQL literal for a value the admin typed. Numbers stay bare,
 *  empty → NULL, everything else is a single-quote-escaped string. */
function sqlLiteral(v: string): string {
  if (v === '' ) return 'NULL';
  if (/^-?\d+(\.\d+)?$/.test(v.trim())) return v.trim();
  if (/^(null)$/i.test(v.trim())) return 'NULL';
  return `'${v.replace(/'/g, "''")}'`;
}
const ident = (s: string) => `"${s.replace(/"/g, '""')}"`;

export function DataBrowser({ deploymentId, schemaEndpoint, queryEndpoint }: DataBrowserProps) {
  const schemaUrl = schemaEndpoint || `/api/admin/deployments/${deploymentId}/database/schema`;
  const queryUrl = queryEndpoint || `/api/admin/deployments/${deploymentId}/database/query`;

  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<{ mode: 'new' | 'edit'; values: Record<string, string>; id?: unknown } | null>(null);
  const [saving, setSaving] = useState(false);

  const runSql = useCallback(async (sql: string): Promise<QueryResult> => {
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Query failed (${res.status})`);
    return data;
  }, [queryUrl]);

  const loadSchema = useCallback(async () => {
    try {
      const res = await fetch(schemaUrl);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load schema');
      const t: TableInfo[] = (data.tables || []).filter((x: TableInfo) => !x.isSystemTable);
      setTables(t);
      setSelected((s) => s || t[0]?.name || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load collections');
    }
  }, [schemaUrl]);

  const loadRows = useCallback(async (table: string) => {
    setLoading(true); setError(null);
    try {
      setResult(await runSql(`SELECT * FROM ${ident(table)} LIMIT ${PAGE}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load records');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [runSql]);

  useEffect(() => { loadSchema(); }, [loadSchema]);
  useEffect(() => { if (selected) loadRows(selected); }, [selected, loadRows]);

  const table = useMemo(() => tables.find((t) => t.name === selected), [tables, selected]);
  const cols = result?.columns || table?.columns.map((c) => c.name) || [];
  const pkCol = useMemo(
    () => table?.columns.find((c) => c.pk)?.name || (cols.includes('id') ? 'id' : cols[0]),
    [table, cols],
  );
  const rows = result?.rows || [];
  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.some((c) => String(c ?? '').toLowerCase().includes(q)));
  }, [rows, search]);

  const openNew = () => setEditing({ mode: 'new', values: Object.fromEntries(cols.map((c) => [c, ''])) });
  const openEdit = (row: unknown[]) => {
    const values = Object.fromEntries(cols.map((c, i) => [c, row[i] == null ? '' : String(row[i])]));
    const id = row[cols.indexOf(pkCol!)];
    setEditing({ mode: 'edit', values, id });
  };

  const save = async () => {
    if (!editing || !selected) return;
    setSaving(true); setError(null);
    try {
      const entries = Object.entries(editing.values);
      if (editing.mode === 'new') {
        const usable = entries.filter(([, v]) => v !== ''); // let DB defaults/autoincrement fill blanks
        const c = usable.map(([k]) => ident(k)).join(', ');
        const v = usable.map(([, val]) => sqlLiteral(val)).join(', ');
        await runSql(`INSERT INTO ${ident(selected)} (${c}) VALUES (${v})`);
      } else {
        const sets = entries
          .filter(([k]) => k !== pkCol)
          .map(([k, val]) => `${ident(k)} = ${sqlLiteral(val)}`)
          .join(', ');
        await runSql(`UPDATE ${ident(selected)} SET ${sets} WHERE ${ident(pkCol!)} = ${sqlLiteral(String(editing.id))}`);
      }
      setEditing(null);
      await loadRows(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const del = async (row: unknown[]) => {
    if (!selected || !pkCol) return;
    const id = row[cols.indexOf(pkCol)];
    if (!confirm(`Delete this record (${pkCol}=${String(id)})? This cannot be undone.`)) return;
    try {
      await runSql(`DELETE FROM ${ident(selected)} WHERE ${ident(pkCol)} = ${sqlLiteral(String(id))}`);
      await loadRows(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Collections list */}
      <div className="w-52 shrink-0 border-r border-border overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Collections</span>
          <button onClick={loadSchema} title="Refresh" className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        {tables.length === 0 && (
          <p className="px-2 py-2 text-xs text-muted-foreground">No collections yet.</p>
        )}
        {tables.map((t) => (
          <button
            key={t.name}
            onClick={() => setSelected(t.name)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
              selected === t.name
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <TableProperties className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t.name}</span>
          </button>
        ))}
      </div>

      {/* Records */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{selected || '—'}</span>
          <span className="text-xs text-muted-foreground">{filtered.length} record{filtered.length === 1 ? '' : 's'}</span>
          <div className="relative ml-auto">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter…"
              className="h-8 w-40 pl-7 text-sm"
            />
          </div>
          <Button size="sm" variant="outline" onClick={() => selected && loadRows(selected)} disabled={!selected}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={openNew} disabled={!selected || cols.length === 0}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New record
          </Button>
        </div>

        {error && <p className="border-b border-border bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

        <div className="min-h-0 flex-1 overflow-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading records…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Database className="h-8 w-8" />
              <p className="text-sm">No records{search ? ' match your filter' : ' yet'}.</p>
              {!search && selected && (
                <Button size="sm" variant="outline" onClick={openNew}><Plus className="mr-1.5 h-3.5 w-3.5" />Add the first record</Button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  {cols.map((c) => (
                    <th key={c} className="whitespace-nowrap px-3 py-2 font-medium text-muted-foreground">
                      {c}{c === pkCol ? ' 🔑' : ''}
                    </th>
                  ))}
                  <th className="w-20 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, ri) => (
                  <tr key={ri} className="group border-b border-border/60 hover:bg-muted/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="max-w-xs truncate px-3 py-1.5 text-foreground/90" title={String(cell ?? '')}>
                        {cell == null ? <span className="text-muted-foreground/60">null</span> : String(cell)}
                      </td>
                    ))}
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => openEdit(row)} title="Edit" className="text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => del(row)} title="Delete" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New / edit record drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => !saving && setEditing(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">
                {editing.mode === 'new' ? 'New record' : 'Edit record'} · <span className="text-muted-foreground">{selected}</span>
              </h3>
              <button onClick={() => !saving && setEditing(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {cols.map((c) => (
                <div key={c}>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {c}{c === pkCol ? ' (key)' : ''}{table?.columns.find((x) => x.name === c)?.type ? ` · ${table.columns.find((x) => x.name === c)!.type}` : ''}
                  </label>
                  <Input
                    value={editing.values[c] ?? ''}
                    onChange={(e) => setEditing((s) => (s ? { ...s, values: { ...s.values, [c]: e.target.value } } : s))}
                    disabled={editing.mode === 'edit' && c === pkCol}
                    placeholder={editing.mode === 'new' && c === pkCol ? 'auto' : ''}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                {editing.mode === 'new' ? 'Create' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
