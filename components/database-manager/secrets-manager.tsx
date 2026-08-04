'use client';

import { XStack, YStack, Paragraph, H3, SizableText } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { toast, Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@hanzo/ui';
import { Secret } from '@/lib/vfs/types';
import {
  Plus, Loader2, AlertCircle, Key, MoreVertical, Pencil, Trash2, AlertTriangle
} from 'lucide-react';
import { SecretEditor } from './secret-editor';
import type { SecretsDataProvider } from './data-providers';

interface SecretsManagerProps {
  deploymentId?: string;
  dataProvider?: SecretsDataProvider;
}

export function SecretsManager({ deploymentId, dataProvider }: SecretsManagerProps) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [encryptionConfigured, setEncryptionConfigured] = useState(true);

  useEffect(() => {
    loadSecrets();
  }, [deploymentId, dataProvider]);

  const loadSecrets = async () => {
    try {
      setLoading(true);
      setError(null);
      if (dataProvider) {
        const result = await dataProvider.list();
        setSecrets(result.secrets);
        setEncryptionConfigured(result.encryptionConfigured);
      } else if (deploymentId) {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/secrets`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load secrets');
        }
        const data = await res.json();
        setSecrets(data.secrets);
        setEncryptionConfigured(data.encryptionConfigured);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load secrets');
    } finally {
      setLoading(false);
    }
  };

  const deleteSecret = async (secret: Secret) => {
    if (!confirm(`Delete secret "${secret.name}"? This cannot be undone.`)) return;

    try {
      if (dataProvider) {
        await dataProvider.remove(secret.id);
      } else if (deploymentId) {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/secrets/${secret.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete secret');
      } else {
        return;
      }
      await loadSecrets();
    } catch (err) {
      console.error('Failed to delete secret:', err);
      toast.error('Failed to delete secret');
    }
  };

  const handleSave = async (data: { name: string; value?: string; description?: string }) => {
    try {
      if (dataProvider) {
        await dataProvider.save(editingSecret?.id || null, data);
      } else if (!deploymentId) {
        throw new Error('No deployment ID available');
      } else if (editingSecret) {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/secrets/${editingSecret.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update secret');
        }
      } else {
        const res = await fetch(`/v1/admin/deployments/${deploymentId}/secrets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create secret');
        }
      }

      setEditingSecret(null);
      setIsCreating(false);
      await loadSecrets();
    } catch (err) {
      throw err;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
        <Button variant="outline" onClick={loadSecrets}>
          Retry
        </Button>
      </YStack>
    );
  }

  return (
    <YStack height="100%">
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
        <H3 fontSize="$3" fontWeight="500">Secrets</H3>
        <Button
          size="sm"
          onClick={() => setIsCreating(true)}
          disabled={!encryptionConfigured}
        >
          <Plus size={16} />
          New Secret
        </Button>
      </XStack>

      {/* Warning if encryption not configured */}
      {!encryptionConfigured && (
        <SizableText alignItems="center" gap="$2" fontSize="$3" backgroundColor="$yellow9" borderWidth={1} borderColor="$yellow9" color="$yellow10" padding="$3" borderRadius="$5" marginBottom="$4" display="flex" flexDirection="row" $theme-dark={{ color: "$yellow8" }}>
          <AlertTriangle size={16} />
          <div>
            <Paragraph fontWeight="500">Encryption not configured</Paragraph>
            <Paragraph fontSize="$1" opacity={0.8}>
              Set the SECRETS_ENCRYPTION_KEY environment variable to enable secrets.
            </Paragraph>
          </div>
        </SizableText>
      )}

      <YStack flex={1} overflow="scroll">
        {secrets.length === 0 ? (
          <SizableText flexDirection="column" alignItems="center" justifyContent="center" height="100%" padding="$6" textAlign="center" borderWidth={1} borderRadius="$5" display="flex">
            <Key size={32} color="$color11" />
            <Paragraph fontSize="$3" color="$color11">No secrets yet</Paragraph>
            <Paragraph fontSize="$1" color="$color11" marginTop="$1" marginBottom="$4">
              Store API keys and tokens securely for your edge functions
            </Paragraph>
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              disabled={!encryptionConfigured}
            >
              <Plus size={16} />
              Create Secret
            </Button>
          </SizableText>
        ) : (
          <YStack gap="$3">
            {secrets.map(secret => (
              <YStack
                key={secret.id}
                borderWidth={1} borderRadius="$5" padding="$4"
              >
                <XStack alignItems="flex-start" justifyContent="space-between" gap="$2">
                  <YStack flex={1} minWidth={0} overflow="hidden">
                    <XStack alignItems="center" gap="$2" flexWrap="wrap">
                      <Key size={16} color="$yellow9" />
                      <SizableText fontFamily="$mono" fontWeight="500" numberOfLines={1}>{secret.name}</SizableText>
                      {!secret.hasValue && (
                        <Badge variant="outline" color="$yellow10" borderColor="$yellow9" backgroundColor="$yellow9" fontSize="$1" flexShrink={0}>
                          Value not set
                        </Badge>
                      )}
                    </XStack>
                    {secret.description && (
                      <Paragraph fontSize="$3" color="$color11" marginTop="$1" numberOfLines={1}>
                        {secret.description}
                      </Paragraph>
                    )}
                    <SizableText alignItems="center" gap="$4" marginTop="$2" fontSize="$1" color="$color11" display="flex" flexDirection="row">
                      <SizableText flexShrink={0}>Updated {formatDate(secret.updatedAt)}</SizableText>
                      <SizableText fontFamily="$mono" numberOfLines={1}>secrets.get('{secret.name}')</SizableText>
                    </SizableText>
                  </YStack>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingSecret(secret)}>
                        <Pencil size={16} />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteSecret(secret)}
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

      {/* Secret Editor Dialog */}
      {(isCreating || editingSecret) && (
        <SecretEditor
          secret={editingSecret}
          isOpen={true}
          onClose={() => {
            setIsCreating(false);
            setEditingSecret(null);
          }}
          onSave={handleSave}
  />
      )}
    </YStack>
  );
}
