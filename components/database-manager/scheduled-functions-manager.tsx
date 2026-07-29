'use client';

import { XStack, YStack, Paragraph, H3, SizableText } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { toast, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@hanzo/ui';
import { ScheduledFunction, EdgeFunction } from '@/lib/vfs/types';
import {
  Plus, Loader2, AlertCircle, Clock, MoreVertical, Pencil, Trash2,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import { ScheduledFunctionEditor } from './scheduled-function-editor';
import type { ScheduledFunctionsDataProvider } from './data-providers';

interface ScheduledFunctionsManagerProps {
  deploymentId?: string;
  dataProvider?: ScheduledFunctionsDataProvider;
}

export function ScheduledFunctionsManager({ deploymentId, dataProvider }: ScheduledFunctionsManagerProps) {
  const [scheduledFunctions, setScheduledFunctions] = useState<ScheduledFunction[]>([]);
  const [edgeFunctions, setEdgeFunctions] = useState<EdgeFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFunction, setEditingFunction] = useState<ScheduledFunction | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadFunctions();
  }, [deploymentId, dataProvider]);

  const loadFunctions = async () => {
    try {
      setLoading(true);
      setError(null);
      if (dataProvider) {
        const [sched, fns] = await Promise.all([
          dataProvider.listScheduled(),
          dataProvider.listEdgeFunctions(),
        ]);
        setScheduledFunctions(sched);
        setEdgeFunctions(fns);
      } else if (deploymentId) {
        const [schedRes, fnRes] = await Promise.all([
          fetch(`/api/admin/deployments/${deploymentId}/scheduled-functions`),
          fetch(`/api/admin/deployments/${deploymentId}/functions`),
        ]);
        if (!schedRes.ok) {
          const data = await schedRes.json();
          throw new Error(data.error || 'Failed to load scheduled functions');
        }
        if (!fnRes.ok) {
          const data = await fnRes.json();
          throw new Error(data.error || 'Failed to load edge functions');
        }
        const schedData = await schedRes.json();
        const fnData = await fnRes.json();
        setScheduledFunctions(schedData.scheduledFunctions);
        setEdgeFunctions(fnData.functions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduled functions');
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = async (fn: ScheduledFunction) => {
    try {
      if (dataProvider) {
        await dataProvider.toggle(fn.id, !fn.enabled);
      } else if (deploymentId) {
        const res = await fetch(`/api/admin/deployments/${deploymentId}/scheduled-functions/${fn.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !fn.enabled }),
        });
        if (!res.ok) throw new Error('Failed to update scheduled function');
      } else {
        return;
      }
      await loadFunctions();
    } catch (err) {
      console.error('Failed to toggle scheduled function:', err);
      toast.error('Failed to update scheduled function');
    }
  };

  const deleteFunction = async (fn: ScheduledFunction) => {
    if (!confirm(`Delete scheduled function "${fn.name}"? This cannot be undone.`)) return;

    try {
      if (dataProvider) {
        await dataProvider.remove(fn.id);
      } else if (deploymentId) {
        const res = await fetch(`/api/admin/deployments/${deploymentId}/scheduled-functions/${fn.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete scheduled function');
      } else {
        return;
      }
      await loadFunctions();
    } catch (err) {
      console.error('Failed to delete scheduled function:', err);
      toast.error('Failed to delete scheduled function');
    }
  };

  const handleSave = async (data: Partial<ScheduledFunction>) => {
    try {
      if (dataProvider) {
        await dataProvider.save(editingFunction?.id || null, data);
      } else if (!deploymentId) {
        throw new Error('No deployment ID available');
      } else if (editingFunction) {
        const res = await fetch(`/api/admin/deployments/${deploymentId}/scheduled-functions/${editingFunction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update scheduled function');
        }
      } else {
        const res = await fetch(`/api/admin/deployments/${deploymentId}/scheduled-functions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create scheduled function');
        }
      }

      setEditingFunction(null);
      setIsCreating(false);
      await loadFunctions();
    } catch (err) {
      throw err;
    }
  };

  const getEdgeFunctionName = (functionId: string) => {
    const fn = edgeFunctions.find(f => f.id === functionId);
    return fn?.name || 'Unknown';
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

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
        <Button variant="outline" onClick={loadFunctions}>
          Retry
        </Button>
      </YStack>
    );
  }

  return (
    <YStack height="100%">
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
        <H3 fontSize="$3" fontWeight="500">Scheduled Functions</H3>
        <Button size="sm" onClick={() => setIsCreating(true)}>
          <Plus size={16} />
          New Schedule
        </Button>
      </XStack>

      <YStack flex={1} overflow="scroll">
        {scheduledFunctions.length === 0 ? (
          <SizableText flexDirection="column" alignItems="center" justifyContent="center" height="100%" padding="$6" textAlign="center" borderWidth={1} borderRadius="$5" display="flex">
            <Clock size={32} color="$color11" />
            <Paragraph fontSize="$3" color="$color11">No scheduled functions yet</Paragraph>
            <Paragraph fontSize="$1" color="$color11" marginTop="$1" marginBottom="$4">
              Run edge functions on a cron schedule
            </Paragraph>
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus size={16} />
              Create Schedule
            </Button>
          </SizableText>
        ) : (
          <YStack gap="$3">
            {scheduledFunctions.map(fn => (
              <YStack
                key={fn.id}
                borderWidth={1} borderRadius="$5" padding="$4" {...{ opacity: !fn.enabled ? 0.6 : undefined, backgroundColor: !fn.enabled ? "$color3" : undefined }}
              >
                <XStack alignItems="flex-start" justifyContent="space-between" gap="$2">
                  <YStack flex={1} minWidth={0} overflow="hidden">
                    <XStack alignItems="center" gap="$2" flexWrap="wrap">
                      <Clock size={16} color="$orange9" />
                      <SizableText fontFamily="$mono" fontWeight="500" numberOfLines={1}>{fn.name}</SizableText>
                      <SizableText fontSize="$1" paddingHorizontal="$1.5" paddingVertical="$0.5" borderRadius="$2" backgroundColor="$orange9" color="$orange10" flexShrink={0}>
                        {fn.cronExpression}
                      </SizableText>
                      {!fn.enabled && (
                        <SizableText fontSize="$1" backgroundColor="$color3" paddingHorizontal="$1.5" paddingVertical="$0.5" borderRadius="$2" flexShrink={0}>disabled</SizableText>
                      )}
                    </XStack>
                    {fn.description && (
                      <Paragraph fontSize="$3" color="$color11" marginTop="$1" numberOfLines={1}>
                        {fn.description}
                      </Paragraph>
                    )}
                    <SizableText alignItems="center" gap="$4" marginTop="$2" fontSize="$1" color="$color11" flexWrap="wrap" display="flex" flexDirection="row">
                      <SizableText flexShrink={0}>
                        Function: <SizableText fontFamily="$mono">{getEdgeFunctionName(fn.functionId)}</SizableText>
                      </SizableText>
                      <SizableText flexShrink={0}>Next: {formatDate(fn.nextRunAt)}</SizableText>
                      {fn.lastStatus && (
                        <SizableText flexShrink={0} {...{ color: fn.lastStatus === 'success' ? "$green10" : "$red10" }}>
                          Last: {fn.lastStatus}
                          {fn.lastRunAt && ` (${formatDate(fn.lastRunAt)})`}
                        </SizableText>
                      )}
                    </SizableText>
                  </YStack>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingFunction(fn)}>
                        <Pencil size={16} />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleEnabled(fn)}>
                        {fn.enabled ? (
                          <>
                            <ToggleLeft size={16} />
                            Disable
                          </>
                        ) : (
                          <>
                            <ToggleRight size={16} />
                            Enable
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteFunction(fn)}
                        color="$red9"
                      >
                        <Trash2 size={16} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </XStack>
              </YStack>
            ))}
          </YStack>
        )}
      </YStack>

      {(isCreating || editingFunction) && (
        <ScheduledFunctionEditor
          scheduledFunction={editingFunction}
          edgeFunctions={edgeFunctions}
          isOpen={true}
          onClose={() => {
            setIsCreating(false);
            setEditingFunction(null);
          }}
          onSave={handleSave}
  />
      )}
    </YStack>
  );
}
