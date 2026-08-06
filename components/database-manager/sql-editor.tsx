'use client';

import { XStack, YStack, SizableText, Paragraph } from '@hanzo/ui';
import { glass } from "@/lib/chrome";
import { useState, useEffect, useCallback } from 'react';
import { CodeEditor } from '@/components/code-editor';
import { Play, AlertCircle, CheckCircle2, History } from 'lucide-react';
import { Button } from '@hanzo/ui';
import { Spinner } from '@/components/ui/spinner';
interface SqlEditorProps {
  deploymentId?: string;
  queryEndpoint?: string;
}

interface QueryResult {
  success: boolean;
  columns?: string[];
  rows?: unknown[][];
  rowsAffected?: number;
  error?: string;
  executionTime?: number;
}

const HISTORY_KEY = 'osw-sql-history';
const MAX_HISTORY = 20;

export function SqlEditor({ deploymentId, queryEndpoint }: SqlEditorProps) {
  const [sql, setSql] = useState('SELECT * FROM ');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load history from localStorage
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  const saveToHistory = useCallback((query: string) => {
    setHistory(prev => {
      const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const executeQuery = useCallback(async () => {
    if (!sql.trim()) return;

    setExecuting(true);
    setResult(null);
    const startTime = Date.now();

    try {
      const endpoint = queryEndpoint || `/v1/admin/deployments/${deploymentId}/database/query`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sql.trim() }),
      });

      const data = await res.json();
      const executionTime = Date.now() - startTime;

      if (!res.ok) {
        setResult({
          success: false,
          error: data.error || 'Query failed',
          executionTime,
        });
      } else {
        setResult({
          success: true,
          columns: data.columns,
          rows: data.rows,
          rowsAffected: data.rowsAffected,
          executionTime,
        });
        saveToHistory(sql.trim());
      }
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Query failed',
        executionTime: Date.now() - startTime,
      });
    } finally {
      setExecuting(false);
    }
  }, [sql, deploymentId, saveToHistory]);

  if (!mounted) {
    return <XStack height="100%" alignItems="center" justifyContent="center">
      <Spinner size={24} />
    </XStack>;
  }

  return (
    <YStack height="100%" gap="$4">
      {/* Editor Section */}
      <YStack gap="$2">
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" gap="$2">
            <Button
              onClick={executeQuery}
              disabled={executing || !sql.trim()}
              size="sm"
            >
              {executing ? (
                <Spinner size={16} />
              ) : (
                <Play size={16} />
              )}
              Execute
            </Button>
            <SizableText fontSize="$1" color="$color11">
              Ctrl/Cmd + Enter
            </SizableText>
          </XStack>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={16} />
            History
          </Button>
        </XStack>

        {/* History dropdown */}
        {showHistory && history.length > 0 && (
          <YStack borderWidth={1} borderRadius="$5" backgroundColor="$background" elevation={4} maxHeight="$17" overflow="scroll">
            {history.map((query, i) => (
              <Button
                key={i}
                onClick={() => {
                  setSql(query);
                  setShowHistory(false);
                }}
                width="100%" paddingHorizontal="$3" paddingVertical="$2" borderBottomWidth={1} hoverStyle={{ backgroundColor: "$color3" }} className="last-flat"
              >
                <SizableText width="100%" textAlign="left" fontSize="$3" fontFamily="$mono" numberOfLines={1}>{query}</SizableText>
              </Button>
            ))}
          </YStack>
        )}

        <YStack
          height="$14" borderWidth={1} borderRadius="$5" overflow="hidden"
          onKeyDown={(e) => {
            // Cmd/Ctrl + Enter to execute (CodeMirror leaves this combo unbound)
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              executeQuery();
            }
          }}
        >
          <CodeEditor
            language="sql"
            value={sql}
            onChange={(value) => setSql(value)}
  />
        </YStack>
      </YStack>

      {/* Results Section */}
      <YStack flex={1} overflow="hidden" borderWidth={1} borderRadius="$5">
        {result === null ? (
          <XStack height="100%" alignItems="center" justifyContent="center">
            <SizableText color="$color11" fontSize="$3">Execute a query to see results</SizableText>
          </XStack>
        ) : result.success ? (
          <YStack height="100%">
            {/* Status bar */}
            <XStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$2" backgroundColor="$color3" borderBottomWidth={1}>
              <CheckCircle2 size={16} />
              {result.rows && result.rows.length > 0 ? (
                <SizableText fontSize="$3">{result.rows.length} row{result.rows.length !== 1 ? 's' : ''}</SizableText>
              ) : result.rowsAffected !== undefined && result.rowsAffected > 0 ? (
                <SizableText fontSize="$3">{result.rowsAffected} row{result.rowsAffected !== 1 ? 's' : ''} affected</SizableText>
              ) : (
                <SizableText fontSize="$3">Query executed successfully</SizableText>
              )}
              <SizableText color="$color11" fontSize="$3">({result.executionTime}ms)</SizableText>
            </XStack>

            {/* Results table */}
            {result.columns && result.columns.length > 0 && result.rows ? (
              <YStack flex={1} overflow="scroll">
                <YStack width="100%">
                  <YStack {...glass(2)} position="sticky" top="$0">
                    <tr>
                      {result.columns.map((col, i) => (
                        <SizableText key={i} textAlign="left" padding="$2" fontWeight="500" fontSize="$3" borderRightWidth={1} className="last-flat-r">
                          {col}
                        </SizableText>
                      ))}
                    </tr>
                  </YStack>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <YStack key={i} borderTopWidth={1} hoverStyle={{ backgroundColor: "$color3" }}>
                        {row.map((cell, j) => (
                          <SizableText key={j} padding="$2" fontFamily="$mono" fontSize="$1" borderRightWidth={1} maxWidth={320} numberOfLines={1} className="last-flat-r">
                            {cell === null ? (
                              <SizableText color="$color11" fontStyle="italic">NULL</SizableText>
                            ) : typeof cell === 'object' ? (
                              JSON.stringify(cell)
                            ) : (
                              String(cell)
                            )}
                          </SizableText>
                        ))}
                      </YStack>
                    ))}
                  </tbody>
                </YStack>
              </YStack>
            ) : null}
          </YStack>
        ) : (
          <YStack height="100%" alignItems="center" justifyContent="center" gap="$2" padding="$4">
            <AlertCircle size={24} />
            <Paragraph fontSize="$3" color="$red9" fontWeight="500">Query Error</Paragraph>
            <Paragraph fontSize="$3" color="$color11" textAlign="center" maxWidth={448}>
              {result.error}
            </Paragraph>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
