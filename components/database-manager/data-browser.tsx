'use client';

import { XStack, YStack, SizableText, Paragraph, H3 } from '@hanzo/gui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Label } from '@hanzo/ui';
import {
  Database, Plus, RefreshCw, Trash2, Pencil, X, Loader2, Search, TableProperties,
} from 'lucide-react';
import { selectAll, insertInto, updateRow, deleteRow } from './sql';

/**
 * Data browser — the native "admin backend for all collections": list every
 * collection, browse its rows, and add / edit / delete records from a UI (no SQL
 * required). Built on the same schema + query endpoints the rest of the manager
 * uses, so it works for a deployment DB (`/v1/admin/deployments/<id>/database/*`)
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

export function DataBrowser({ deploymentId, schemaEndpoint, queryEndpoint }: DataBrowserProps) {
  const schemaUrl = schemaEndpoint || `/v1/admin/deployments/${deploymentId}/database/schema`;
  const queryUrl = queryEndpoint || `/v1/admin/deployments/${deploymentId}/database/query`;

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
      setResult(await runSql(selectAll(PAGE)(table)));
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
      // Pure SQL construction lives in ./sql — the component only decides which.
      await runSql(
        editing.mode === 'new'
          ? insertInto(selected)(editing.values)
          : updateRow(selected)(pkCol!)(String(editing.id))(editing.values),
      );
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
      await runSql(deleteRow(selected)(pkCol)(String(id)));
      await loadRows(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <XStack height="100%" minHeight={0}>
      {/* Collections list */}
      <YStack width="$20" flexShrink={0} borderRightWidth={1} borderColor="$borderColor" padding="$2" overflow="scroll">
        <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$2" paddingVertical="$1.5">
          <SizableText fontSize="$1" fontWeight="500" color="$color11" textTransform="uppercase" letterSpacing={0.4}>Collections</SizableText>
          <Button onClick={loadSchema} title="Refresh">
            <RefreshCw size={14} />
          </Button>
        </XStack>
        {tables.length === 0 && (
          <Paragraph paddingHorizontal="$2" paddingVertical="$2" fontSize="$1" color="$color11">No collections yet.</Paragraph>
        )}
        {tables.map((t) => (
          <Button
            key={t.name}
            onClick={() => setSelected(t.name)}
            width="100%" alignItems="center" gap="$2" borderRadius="$3" paddingHorizontal="$2" paddingVertical="$1.5" {...{ backgroundColor: selected === t.name ? "$color3" : undefined, hoverStyle: selected === t.name ? undefined : { backgroundColor: "$color3" } }}
          >
            <TableProperties size={14} color={selected === t.name ? "$color" : "$color11"} />
            <SizableText numberOfLines={1} fontSize="$3" color={selected === t.name ? "$color" : "$color11"}>{t.name}</SizableText>
          </Button>
        ))}
      </YStack>

      {/* Records */}
      <YStack minWidth={0} flex={1}>
        <XStack alignItems="center" gap="$2" borderBottomWidth={1} borderColor="$borderColor" paddingHorizontal="$3" paddingVertical="$2">
          <Database size={16} />
          <SizableText fontSize="$3" fontWeight="500" color="$color">{selected || '—'}</SizableText>
          <SizableText fontSize="$1" color="$color11">{filtered.length} record{filtered.length === 1 ? '' : 's'}</SizableText>
          <YStack position="relative" marginLeft="auto">
            <Search size={14} />
            <Input
              value={search}
              onChangeText={(t) => setSearch(t)}
              placeholder="Filter…"
              height="$6" width="$17" paddingLeft={28} fontSize="$3"
  />
          </YStack>
          <Button size="sm" variant="outline" onClick={() => selected && loadRows(selected)} disabled={!selected}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button size="sm" onClick={openNew} disabled={!selected || cols.length === 0}>
            <Plus size={14} /> New record
          </Button>
        </XStack>

        {error && <Paragraph borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$red9" paddingHorizontal="$3" paddingVertical="$2" fontSize="$1" color="$red9">{error}</Paragraph>}

        <YStack minHeight={0} flex={1} overflow="scroll">
          {loading ? (
            <XStack height="100%" alignItems="center" justifyContent="center">
              <Loader2 size={16} />
              <SizableText color="$color11"> Loading records…</SizableText>
            </XStack>
          ) : filtered.length === 0 ? (
            <YStack height="100%" alignItems="center" justifyContent="center" gap="$2">
              <Database size={32} />
              <Paragraph fontSize="$3">No records{search ? ' match your filter' : ' yet'}.</Paragraph>
              {!search && selected && (
                <Button size="sm" variant="outline" onClick={openNew}><Plus size={14} />Add the first record</Button>
              )}
            </YStack>
          ) : (
            <YStack width="100%">
              <YStack position="sticky" top="$0" backgroundColor="$background">
                <YStack borderBottomWidth={1} borderColor="$borderColor">
                  {cols.map((c) => (
                    <SizableText key={c} whiteSpace="nowrap" paddingHorizontal="$3" paddingVertical="$2" fontWeight="500" color="$color11">
                      {c}{c === pkCol ? ' 🔑' : ''}
                    </SizableText>
                  ))}
                  <SizableText width="$11" paddingHorizontal="$3" paddingVertical="$2" />
                </YStack>
              </YStack>
              <tbody>
                {filtered.map((row, ri) => (
                  <YStack key={ri} group borderBottomWidth={1} borderColor="$borderColor" hoverStyle={{ backgroundColor: "$color3" }}>
                    {row.map((cell, ci) => (
                      <SizableText key={ci} maxWidth={320} numberOfLines={1} paddingHorizontal="$3" paddingVertical="$1.5" color="$color">
                        {cell == null ? <SizableText color="$color11">null</SizableText> : String(cell)}
                      </SizableText>
                    ))}
                    <SizableText paddingHorizontal="$3" paddingVertical="$1.5">
                      <XStack alignItems="center" gap="$1" opacity={0} $group-hover={{ opacity: 1 }}>
                        <Button onClick={() => openEdit(row)} title="Edit">
                          <Pencil size={14} />
                        </Button>
                        <Button onClick={() => del(row)} title="Delete">
                          <Trash2 size={14} />
                        </Button>
                      </XStack>
                    </SizableText>
                  </YStack>
                ))}
              </tbody>
            </YStack>
          )}
        </YStack>
      </YStack>

      {/* New / edit record drawer */}
      {editing && (
        <XStack position="fixed" top={0} right={0} bottom={0} left={0} zIndex={50} justifyContent="flex-end" backgroundColor="black" onClick={() => !saving && setEditing(null)}>
          <YStack height="100%" width="100%" maxWidth={448} backgroundColor="$background" padding="$4.5" elevation={6} overflow="scroll" onClick={(e) => e.stopPropagation()}>
            <XStack marginBottom="$4" alignItems="center" justifyContent="space-between">
              <H3 fontSize="$6" fontWeight="500" color="$color">
                {editing.mode === 'new' ? 'New record' : 'Edit record'} · <SizableText color="$color11">{selected}</SizableText>
              </H3>
              <Button onClick={() => !saving && setEditing(null)}>
                <X size={20} />
              </Button>
            </XStack>
            <YStack rowGap="$3">
              {cols.map((c) => (
                <div key={c}>
                  <Label marginBottom="$1" fontSize="$1" fontWeight="500" color="$color11">
                    {c}{c === pkCol ? ' (key)' : ''}{table?.columns.find((x) => x.name === c)?.type ? ` · ${table.columns.find((x) => x.name === c)!.type}` : ''}
                  </Label>
                  <Input
                    value={editing.values[c] ?? ''}
                    onChangeText={(t) => setEditing((s) => (s ? { ...s, values: { ...s.values, [c]: t } } : s))}
                    disabled={editing.mode === 'edit' && c === pkCol}
                    placeholder={editing.mode === 'new' && c === pkCol ? 'auto' : ''}
                    fontSize="$3"
  />
                </div>
              ))}
            </YStack>
            <XStack marginTop="$4.5" alignItems="center" justifyContent="flex-end" gap="$2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 size={16} /> : null}
                {editing.mode === 'new' ? 'Create' : 'Save'}
              </Button>
            </XStack>
          </YStack>
        </XStack>
      )}
    </XStack>
  );
}
