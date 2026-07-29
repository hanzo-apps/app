'use client';

import { XStack, YStack, Paragraph, H3, SizableText } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { TableInfo } from '@/lib/vfs/types';
import { ChevronRight, ChevronDown, Table2, KeyRound, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@hanzo/ui';

interface SchemaViewerProps {
  deploymentId?: string;
  schemaEndpoint?: string;
  showSystemTablesToggle?: boolean;
}

export function SchemaViewer({ deploymentId, schemaEndpoint, showSystemTablesToggle = true }: SchemaViewerProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [showSystemTables, setShowSystemTables] = useState(false);

  const endpoint = schemaEndpoint || `/api/admin/deployments/${deploymentId}/database/schema`;

  useEffect(() => {
    loadSchema();
  }, [endpoint]);

  const loadSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(endpoint);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load schema');
      }
      const data = await res.json();
      setTables(data.tables);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  const filteredTables = showSystemTables
    ? tables
    : tables.filter(t => !t.isSystemTable);

  if (loading) {
    return (
      <XStack alignItems="center" justifyContent="center" height="100%">
        <Loader2 size={24} color="$color11" />
      </XStack>
    );
  }

  if (error) {
    return (
      <YStack alignItems="center" justifyContent="center" height="100%" gap="$4">
        <AlertCircle size={32} color="$red9" />
        <Paragraph fontSize="$3" color="$color11">{error}</Paragraph>
        <Button variant="outline" onClick={loadSchema}>
          Retry
        </Button>
      </YStack>
    );
  }

  return (
    <YStack height="100%">
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
        <H3 fontSize="$3" fontWeight="500">Database Tables</H3>
        {showSystemTablesToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSystemTables(!showSystemTables)}
            fontSize="$1"
          >
            {showSystemTables ? (
              <>
                <EyeOff size={14} />
                Hide System Tables
              </>
            ) : (
              <>
                <Eye size={14} />
                Show System Tables
              </>
            )}
          </Button>
        )}
      </XStack>

      <YStack flex={1} overflow="scroll" borderWidth={1} borderRadius="$5">
        {filteredTables.length === 0 ? (
          <SizableText flexDirection="column" alignItems="center" justifyContent="center" height="100%" padding="$6" textAlign="center" display="flex">
            <Table2 size={32} color="$color11" />
            <Paragraph fontSize="$3" color="$color11">No user tables found</Paragraph>
            <Paragraph fontSize="$1" color="$color11" marginTop="$1">
              Create tables using the SQL editor
            </Paragraph>
          </SizableText>
        ) : (
          <YStack>
            {filteredTables.map(table => (
              <YStack key={table.name} {...{ backgroundColor: table.isSystemTable ? "$color3" : undefined }}>
                <Button
                  onClick={() => toggleTable(table.name)}
                  width="100%" alignItems="center" gap="$2" padding="$3" textAlign="left" hoverStyle={{ backgroundColor: "$color3" }}
                >
                  {expandedTables.has(table.name) ? (
                    <ChevronDown size={16} color="$color11" />
                  ) : (
                    <ChevronRight size={16} color="$color11" />
                  )}
                  <Table2 size={16} color="$blue9" />
                  <SizableText flex={1} fontFamily="$mono" fontSize="$3">{table.name}</SizableText>
                  <SizableText fontSize="$1" color="$color11">
                    {table.rowCount} row{table.rowCount !== 1 ? 's' : ''}
                  </SizableText>
                  {table.isSystemTable && (
                    <SizableText fontSize="$1" backgroundColor="$color3" paddingHorizontal="$1.5" paddingVertical="$0.5" borderRadius="$2">system</SizableText>
                  )}
                </Button>

                {expandedTables.has(table.name) && (
                  <YStack backgroundColor="$color3" borderTopWidth={1}>
                    <SizableText width="100%" fontSize="$3" display="flex" flexDirection="column">
                      <thead>
                        <YStack borderBottomWidth={1} backgroundColor="$color3">
                          <SizableText textAlign="left" padding="$2" fontWeight="500">Column</SizableText>
                          <SizableText textAlign="left" padding="$2" fontWeight="500">Type</SizableText>
                          <SizableText textAlign="left" padding="$2" fontWeight="500">Nullable</SizableText>
                          <SizableText textAlign="left" padding="$2" fontWeight="500">Default</SizableText>
                        </YStack>
                      </thead>
                      <tbody>
                        {table.columns.map(col => (
                          <YStack key={col.name} borderBottomWidth={1} className="last:border-0">
                            <SizableText padding="$2" fontFamily="$mono" alignItems="center" gap="$1.5">
                              {col.primaryKey && (
                                <KeyRound size={12} color="$yellow9" />
                              )}
                              {col.name}
                            </SizableText>
                            <SizableText padding="$2" fontFamily="$mono" color="$color11">
                              {col.type || 'TEXT'}
                            </SizableText>
                            <SizableText padding="$2" color="$color11">
                              {col.nullable ? 'Yes' : 'No'}
                            </SizableText>
                            <SizableText padding="$2" fontFamily="$mono" color="$color11" fontSize="$1">
                              {col.defaultValue || '-'}
                            </SizableText>
                          </YStack>
                        ))}
                      </tbody>
                    </SizableText>
                  </YStack>
                )}
              </YStack>
            ))}
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
