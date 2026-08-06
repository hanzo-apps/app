'use client';

import { XStack, YStack, Paragraph, H3, SizableText } from '@hanzo/ui';
import { useState, useEffect } from 'react';
import { toast, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@hanzo/ui';
import { EdgeFunction } from '@/lib/vfs/types';
import {
  Plus, AlertCircle, Code2, MoreVertical, Pencil, Trash2,
  ToggleLeft, ToggleRight, Copy, ExternalLink, CheckCircle2
} from 'lucide-react';
import { FunctionEditor } from './function-editor';
import type { FunctionsDataProvider } from './data-providers';
import { Spinner } from '@/components/ui/spinner';

interface FunctionsManagerProps {
  deploymentId?: string;
  dataProvider?: FunctionsDataProvider;
  hideRuntimeFeatures?: boolean;
}

export function FunctionsManager({ deploymentId, dataProvider, hideRuntimeFeatures }: FunctionsManagerProps) {
  const [functions, setFunctions] = useState<EdgeFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFunction, setEditingFunction] = useState<EdgeFunction | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

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
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/functions`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load functions');
        }
        const data = await res.json();
        setFunctions(data.functions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load functions');
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = async (fn: EdgeFunction) => {
    try {
      if (dataProvider) {
        await dataProvider.toggle(fn.id, !fn.enabled);
      } else if (deploymentId) {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/functions/${fn.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !fn.enabled }),
        });
        if (!res.ok) throw new Error('Failed to update function');
      } else {
        return;
      }
      await loadFunctions();
    } catch (err) {
      console.error('Failed to toggle function:', err);
      toast.error('Failed to update function');
    }
  };

  const deleteFunction = async (fn: EdgeFunction) => {
    if (!confirm(`Delete function "${fn.name}"? This cannot be undone.`)) return;

    try {
      if (dataProvider) {
        await dataProvider.remove(fn.id);
      } else if (deploymentId) {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/functions/${fn.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete function');
      } else {
        return;
      }
      await loadFunctions();
    } catch (err) {
      console.error('Failed to delete function:', err);
      toast.error('Failed to delete function');
    }
  };

  const copyUrl = (fn: EdgeFunction) => {
    if (!deploymentId) return;
    const url = `${window.location.origin}/v1/deployments/${deploymentId}/functions/${fn.name}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(fn.id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleSave = async (data: Partial<EdgeFunction>) => {
    try {
      if (dataProvider) {
        await dataProvider.save(editingFunction?.id || null, data);
      } else if (!deploymentId) {
        throw new Error('No deployment ID available');
      } else if (editingFunction) {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/functions/${editingFunction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update function');
        }
      } else {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/functions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create function');
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
        <Spinner size={24} />
      </XStack>
    );
  }

  if (error) {
    return (
      <YStack alignItems="center" justifyContent="center" height="100%" gap="$4">
        <AlertCircle size={32} />
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
        <H3 fontSize="$3" fontWeight="500">Edge Functions</H3>
        <Button size="sm" onClick={() => setIsCreating(true)}>
          <Plus size={16} />
          New Function
        </Button>
      </XStack>

      <YStack flex={1} overflow="scroll">
        {functions.length === 0 ? (
          <YStack alignItems="center" justifyContent="center" height="100%" padding="$6" borderWidth={1} borderRadius="$5">
            <Code2 size={32} />
            <Paragraph fontSize="$3" color="$color11" textAlign="center">No edge functions yet</Paragraph>
            <Paragraph fontSize="$1" color="$color11" marginTop="$1" marginBottom="$4" textAlign="center">
              Create your first API endpoint
            </Paragraph>
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus size={16} />
              Create Function
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
                      <Code2 size={16} />
                      <SizableText fontFamily="$mono" fontWeight="500" numberOfLines={1}>{fn.name}</SizableText>
                      <SizableText fontSize="$1" paddingHorizontal="$1.5" paddingVertical="$0.5" borderRadius="$2" flexShrink={0} {...(fn.method === 'ANY' ? { backgroundColor: "rgba(168,85,247,0.2)", color: "#9333ea" } : fn.method === 'GET' ? { backgroundColor: "rgba(34,197,94,0.2)", color: "#16a34a" } :
                        fn.method === 'POST' ? { backgroundColor: "rgba(59,130,246,0.2)", color: "#2563eb" } :
                        fn.method === 'PUT' ? { backgroundColor: "rgba(234,179,8,0.2)", color: "#ca8a04" } :
                        { backgroundColor: "rgba(239,68,68,0.2)", color: "#dc2626" })}>
                        {fn.method}
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
                    <XStack alignItems="center" gap="$4" marginTop="$2">
                      <SizableText flexShrink={0} fontSize="$1" color="$color11">Timeout: {fn.timeoutMs / 1000}s</SizableText>
                      {!hideRuntimeFeatures && deploymentId && (
                        <Button
                          onClick={() => copyUrl(fn)}
                          backgroundColor="transparent" alignItems="center" gap="$1" flexShrink={0} group
                        >
                          <XStack alignItems="center" gap="$1">
                            {copiedUrl === fn.id ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <Copy size={12} />
                            )}
                            <SizableText fontSize="$1" color="$color11" $group-hover={{ color: "$color" }}>
                              {copiedUrl === fn.id ? 'Copied!' : 'Copy URL'}
                            </SizableText>
                          </XStack>
                        </Button>
                      )}
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
                      {!hideRuntimeFeatures && deploymentId && (
                        <DropdownMenuItem
                          onClick={() => window.open(`/v1/deployments/${deploymentId}/functions/${fn.name}`, '_blank')}
                        >
                          <ExternalLink size={16} />
                          Open in Browser
                        </DropdownMenuItem>
                      )}
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

      {/* Function Editor Dialog */}
      {(isCreating || editingFunction) && (
        <FunctionEditor
          deploymentId={deploymentId || ''}
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
