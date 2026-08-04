'use client';

import { XStack, YStack, Paragraph, H3, SizableText } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { FunctionLog } from '@/lib/vfs/types';
import {
  Loader2, AlertCircle, RefreshCw, Trash2, CheckCircle2, XCircle,
  Clock, ArrowRight
} from 'lucide-react';
import { Button } from '@hanzo/ui';
interface LogsViewerProps {
  deploymentId: string;
}

interface EnrichedLog extends FunctionLog {
  functionName?: string;
}

export function LogsViewer({ deploymentId }: LogsViewerProps) {
  const [logs, setLogs] = useState<EnrichedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [deploymentId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/v1/admin/deployments/${deploymentId}/database/logs?limit=200`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load logs');
      }
      const data = await res.json();
      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Clear all function execution logs? This cannot be undone.')) return;

    try {
      const res = await fetch(`/v1/admin/deployments/${deploymentId}/database/logs`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to clear logs');
      await loadLogs();
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <XStack alignItems="center" justifyContent="center" height="100%">
        <Loader2 size={24} />
      </XStack>
    );
  }

  if (error) {
    return (
      <YStack alignItems="center" justifyContent="center" height="100%" gap="$4">
        <AlertCircle size={32} />
        <Paragraph fontSize="$3" color="$color11">{error}</Paragraph>
        <Button variant="outline" onClick={loadLogs}>
          Retry
        </Button>
      </YStack>
    );
  }

  return (
    <YStack height="100%">
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
        <H3 fontSize="$3" fontWeight="500">Execution Logs</H3>
        <XStack alignItems="center" gap="$2">
          <Button variant="ghost" size="sm" onClick={loadLogs}>
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            disabled={logs.length === 0}
          >
            <Trash2 size={16} />
            <SizableText color="$red9">Clear</SizableText>
          </Button>
        </XStack>
      </XStack>

      <YStack flex={1} overflow="scroll" borderWidth={1} borderRadius="$5">
        {logs.length === 0 ? (
          <SizableText flexDirection="column" alignItems="center" justifyContent="center" height="100%" padding="$6" textAlign="center" display="flex">
            <Clock size={32} />
            <Paragraph fontSize="$3" color="$color11">No execution logs yet</Paragraph>
            <Paragraph fontSize="$1" color="$color11" marginTop="$1">
              Logs will appear here when functions are invoked
            </Paragraph>
          </SizableText>
        ) : (
          <SizableText width="100%" fontSize="$3" display="flex" flexDirection="column">
            <YStack position="sticky" top="$0" backgroundColor="$color3">
              <tr>
                <SizableText textAlign="left" padding="$3" fontWeight="500">Status</SizableText>
                <SizableText textAlign="left" padding="$3" fontWeight="500">Function</SizableText>
                <SizableText textAlign="left" padding="$3" fontWeight="500">Method</SizableText>
                <SizableText textAlign="left" padding="$3" fontWeight="500">Path</SizableText>
                <SizableText textAlign="left" padding="$3" fontWeight="500">Duration</SizableText>
                <SizableText textAlign="left" padding="$3" fontWeight="500">Time</SizableText>
              </tr>
            </YStack>
            <tbody>
              {logs.map(log => (
                <YStack key={log.id} borderTopWidth={1} hoverStyle={{ backgroundColor: "$color3" }}>
                  <SizableText padding="$3">
                    {log.statusCode >= 200 && log.statusCode < 300 ? (
                      <CheckCircle2 size={16} />
                    ) : log.statusCode >= 400 ? (
                      <XCircle size={16} />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                  </SizableText>
                  <SizableText padding="$3" fontFamily="$mono">
                    {log.functionName || log.functionId.slice(0, 8)}
                  </SizableText>
                  <SizableText padding="$3">
                    <SizableText fontSize="$1" paddingHorizontal="$1.5" paddingVertical="$0.5" borderRadius="$2" {...(log.method === 'GET' ? { backgroundColor: "rgba(34,197,94,0.2)", color: "#16a34a" } : log.method === 'POST' ? { backgroundColor: "rgba(59,130,246,0.2)", color: "#2563eb" } :
                      log.method === 'PUT' ? { backgroundColor: "rgba(234,179,8,0.2)", color: "#ca8a04" } :
                      log.method === 'DELETE' ? { backgroundColor: "rgba(239,68,68,0.2)", color: "#dc2626" } :
                      { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" })}>
                      {log.method}
                    </SizableText>
                  </SizableText>
                  <SizableText padding="$3" fontFamily="$mono" fontSize="$1" color="$color11">
                    {log.path}
                  </SizableText>
                  <SizableText padding="$3" color="$color11">
                    {log.durationMs}ms
                  </SizableText>
                  <SizableText padding="$3" fontSize="$1" color="$color11">
                    {formatDate(log.timestamp)}
                  </SizableText>
                </YStack>
              ))}
            </tbody>
          </SizableText>
        )}
      </YStack>
    </YStack>
  );
}
