'use client';

import { XStack, YStack, Paragraph, H3, SizableText } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { toast, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@hanzo/ui';
import { ServerFunction } from '@/lib/vfs/types';
import {
  Plus, Loader2, AlertCircle, Wrench, MoreVertical, Pencil, Trash2,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import { ServerFunctionEditor } from './server-function-editor';
import type { ServerFunctionsDataProvider } from './data-providers';

interface ServerFunctionsManagerProps {
  deploymentId?: string;
  dataProvider?: ServerFunctionsDataProvider;
}

export function ServerFunctionsManager({ deploymentId, dataProvider }: ServerFunctionsManagerProps) {
  const [functions, setFunctions] = useState<ServerFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFunction, setEditingFunction] = useState<ServerFunction | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadFunctions();
  }, [deploymentId, dataProvider]);

  const loadFunctions = async () => {
    try {
      setLoading(true);
      setError(null);
      if (dataProvider) {
        setFunctions(await dataProvider.list());
      } else if (deploymentId) {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/server-functions`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load server functions');
        }
        const data = await res.json();
        setFunctions(data.functions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load server functions');
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = async (fn: ServerFunction) => {
    try {
      if (dataProvider) {
        await dataProvider.toggle(fn.id, !fn.enabled);
      } else if (deploymentId) {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/server-functions/${fn.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !fn.enabled }),
        });
        if (!res.ok) throw new Error('Failed to update server function');
      } else {
        return;
      }
      await loadFunctions();
    } catch (err) {
      console.error('Failed to toggle server function:', err);
      toast.error('Failed to update server function');
    }
  };

  const deleteFunction = async (fn: ServerFunction) => {
    if (!confirm(`Delete server function "${fn.name}"? This cannot be undone.`)) return;

    try {
      if (dataProvider) {
        await dataProvider.remove(fn.id);
      } else if (deploymentId) {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/server-functions/${fn.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete server function');
      } else {
        return;
      }
      await loadFunctions();
    } catch (err) {
      console.error('Failed to delete server function:', err);
      toast.error('Failed to delete server function');
    }
  };

  const handleSave = async (data: Partial<ServerFunction>) => {
    try {
      if (dataProvider) {
        await dataProvider.save(editingFunction?.id || null, data);
      } else if (!deploymentId) {
        throw new Error('No deployment ID available');
      } else if (editingFunction) {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/server-functions/${editingFunction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update server function');
        }
      } else {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/server-functions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create server function');
        }
      }

      setEditingFunction(null);
      setIsCreating(false);
      await loadFunctions();
    } catch (err) {
      throw err;
    }
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
        <H3 fontSize="$3" fontWeight="500">Server Functions (Helpers)</H3>
        <Button size="sm" onClick={() => setIsCreating(true)}>
          <Plus size={16} />
          New Helper
        </Button>
      </XStack>

      <YStack flex={1} overflow="scroll">
        {functions.length === 0 ? (
          <YStack alignItems="center" justifyContent="center" height="100%" padding="$6" borderWidth={1} borderRadius="$5">
            <Wrench size={32} color="$color11" />
            <Paragraph fontSize="$3" color="$color11" textAlign="center">No server functions yet</Paragraph>
            <Paragraph fontSize="$1" color="$color11" marginTop="$1" marginBottom="$4" textAlign="center">
              Create reusable helpers for your edge functions
            </Paragraph>
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus size={16} />
              Create Helper
            </Button>
          </YStack>
        ) : (
          <YStack gap="$3">
            {functions.map(fn => (
              <YStack
                key={fn.id}
                borderWidth={1} borderRadius="$5" padding="$4" {...{ opacity: !fn.enabled ? 0.6 : undefined, backgroundColor: !fn.enabled ? "$color3" : undefined }}
              >
                <XStack alignItems="flex-start" justifyContent="space-between" gap="$2">
                  <YStack flex={1} minWidth={0} overflow="hidden">
                    <XStack alignItems="center" gap="$2" flexWrap="wrap">
                      <Wrench size={16} color="$orange9" />
                      <SizableText fontFamily="$mono" fontWeight="500" numberOfLines={1}>{fn.name}</SizableText>
                      {!fn.enabled && (
                        <SizableText fontSize="$1" backgroundColor="$color3" paddingHorizontal="$1.5" paddingVertical="$0.5" borderRadius="$2" flexShrink={0}>disabled</SizableText>
                      )}
                    </XStack>
                    {fn.description && (
                      <Paragraph fontSize="$3" color="$color11" marginTop="$1" numberOfLines={1}>
                        {fn.description}
                      </Paragraph>
                    )}
                    <XStack alignItems="center" gap="$4" marginTop="$2">
                      <SizableText fontFamily="$mono" fontSize="$1" color="$color11" numberOfLines={1}>server.{fn.name}(args)</SizableText>
                    </XStack>
                  </YStack>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
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
                        variant="destructive"
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

      {/* Server Function Editor Dialog */}
      {(isCreating || editingFunction) && (
        <ServerFunctionEditor
          function={editingFunction}
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
