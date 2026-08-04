'use client';

import { YStack, XStack, H4, Paragraph, SizableText } from '@hanzo/gui';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Button, toast, Textarea } from '@hanzo/ui';
import { Play } from 'lucide-react';
import { SchemaViewer } from '@/components/database-manager/schema-viewer';
import { SqlEditor } from '@/components/database-manager/sql-editor';
import { Spinner } from '@/components/ui/spinner';

interface SchemaEditorProps {
  projectId: string;
  enabled: boolean;
  onSchemaChange?: (schema: string) => void;
}

// Keep these exports — used by vfs/index.ts for transient file generation
export function getProjectSchema(projectId: string): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(`osw-db-schema-${projectId}`) || '';
}

export function setProjectSchema(projectId: string, schema: string): void {
  if (typeof window === 'undefined') return;
  if (schema) {
    localStorage.setItem(`osw-db-schema-${projectId}`, schema);
  } else {
    localStorage.removeItem(`osw-db-schema-${projectId}`);
  }
}

/**
 * Save schema to localStorage and apply DDL to the project database (Server Mode only).
 * Used by project-manager and template-manager during project creation.
 */
export async function applyProjectDatabaseSchema(projectId: string, ddl: string): Promise<void> {
  setProjectSchema(projectId, ddl);
  if (process.env.NEXT_PUBLIC_SERVER_MODE === 'true') {
    try {
      const res = await fetch(`/v1/builder/${projectId}/database/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: ddl }),
      });
      if (!res.ok) {
        console.warn('[Schema] DDL apply failed — will auto-heal on Schema tab open');
      }
    } catch {
      // Non-fatal — auto-apply on Schema tab open will recover
    }
  }
}

type SubTab = 'tables' | 'sql' | 'ddl';

export function SchemaEditor({ projectId, enabled, onSchemaChange }: SchemaEditorProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('tables');
  const [ddl, setDdl] = useState('');
  const [applying, setApplying] = useState(false);
  const [schemaKey, setSchemaKey] = useState(0);
  const autoAppliedRef = useRef<string | null>(null);

  const schemaEndpoint = `/v1/builder/${projectId}/database/schema`;
  const queryEndpoint = `/v1/builder/${projectId}/database/query`;

  // Auto-apply: if localStorage has schema DDL but the project database has no tables,
  // apply the DDL automatically. This self-heals when the initial application during
  // project creation failed (e.g., project not yet synced to SQLite, server restart).
  useEffect(() => {
    if (!enabled) return;
    // Only auto-apply once per projectId
    if (autoAppliedRef.current === projectId) return;

    const storedSchema = getProjectSchema(projectId);
    if (!storedSchema) return;

    const tryAutoApply = async () => {
      try {
        // Check if database already has tables
        const schemaRes = await fetch(schemaEndpoint);
        if (!schemaRes.ok) return;
        const schemaData = await schemaRes.json();
        if (schemaData.tables && schemaData.tables.length > 0) {
          autoAppliedRef.current = projectId;
          return; // Already has tables, nothing to do
        }

        // Database is empty but localStorage has DDL — apply it
        const res = await fetch(queryEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: storedSchema }),
        });

        if (res.ok) {
          autoAppliedRef.current = projectId;
          setSchemaKey(prev => prev + 1);
        }
      } catch {
        // Non-fatal — user can manually apply via DDL tab
      }
    };

    tryAutoApply();
  }, [enabled, projectId, schemaEndpoint, queryEndpoint]);

  const applyDDL = useCallback(async () => {
    if (!ddl.trim()) return;

    setApplying(true);
    try {
      const res = await fetch(queryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: ddl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to apply DDL');
        return;
      }

      toast.success('DDL applied successfully');

      // Update localStorage schema (append DDL) so AI server context stays in sync
      const existing = getProjectSchema(projectId);
      const updated = existing ? `${existing}\n\n${ddl.trim()}` : ddl.trim();
      setProjectSchema(projectId, updated);
      onSchemaChange?.(updated);

      // Refresh SchemaViewer
      setSchemaKey(prev => prev + 1);
      setDdl('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply DDL');
    } finally {
      setApplying(false);
    }
  }, [ddl, queryEndpoint, projectId, onSchemaChange]);

  if (!enabled) {
    return null;
  }

  return (
    <YStack height="100%">
      {/* Sub-tab buttons */}
      <XStack alignItems="center" gap="$1" marginBottom="$3" borderBottomWidth={1} paddingBottom="$2">
        {(['tables', 'sql', 'ddl'] as const).map(tab => (
          <Button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            paddingHorizontal="$3" paddingVertical="$1.5" borderRadius="$3" {...{ backgroundColor: activeSubTab === tab ? "$color12" : undefined, hoverStyle: activeSubTab === tab ? undefined : { backgroundColor: "$color3" } }}
          >
            <SizableText fontSize="$1" fontWeight="500" color={activeSubTab === tab ? "$background" : "$color11"}>
              {tab === 'tables' ? 'Tables' : tab === 'sql' ? 'SQL' : 'DDL'}
            </SizableText>
          </Button>
        ))}
      </XStack>

      {/* Sub-tab content */}
      <YStack flex={1} minHeight={0}>
        {activeSubTab === 'tables' && (
          <SchemaViewer
            key={schemaKey}
            schemaEndpoint={schemaEndpoint}
            showSystemTablesToggle={false}
  />
        )}

        {activeSubTab === 'sql' && (
          <SqlEditor queryEndpoint={queryEndpoint} />
        )}

        {activeSubTab === 'ddl' && (
          <YStack height="100%" gap="$3">
            <XStack alignItems="center" justifyContent="space-between">
              <div>
                <H4 fontSize="$3" fontWeight="500">Apply DDL</H4>
                <Paragraph fontSize="$1" color="$color11" marginTop="$0.5">
                  CREATE TABLE, ALTER TABLE, and other DDL statements
                </Paragraph>
              </div>
              <Button
                size="sm"
                height={28} paddingHorizontal="$2"
                onClick={applyDDL}
                disabled={applying || !ddl.trim()}
              >
                {applying ? (
                  <Spinner size={12} />
                ) : (
                  <Play size={12} />
                )}
                Apply
              </Button>
            </XStack>
            <Textarea
              data-schema-editor
              flex={1} width="100%" borderRadius="$3" borderWidth={1} borderColor="$color2" backgroundColor="$background" paddingHorizontal="$3" paddingVertical="$2" fontSize="$3" fontFamily="$mono" placeholderTextColor="$color11" focusVisibleStyle={{ outlineWidth: 0 }}
              placeholder={`-- Create or modify tables\nCREATE TABLE IF NOT EXISTS example (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);`}
              value={ddl}
              onChangeText={(t) => setDdl(t)}
              spellCheck={false}
  />
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
