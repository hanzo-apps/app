'use client';

import { YStack, Paragraph, SizableText, XStack } from '@hanzo/ui';
import React, { useState, useEffect } from 'react';
import { Secret } from '@/lib/vfs/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Button, Input, Label } from '@hanzo/ui';
import { AlertCircle, Eye, EyeOff, Info } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface SecretEditorProps {
  secret: Secret | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; value?: string; description?: string }) => Promise<void>;
}

export function SecretEditor({
  secret,
  isOpen,
  onClose,
  onSave,
}: SecretEditorProps) {
  const [name, setName] = useState(secret?.name || '');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState(secret?.description || '');
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(secret?.name || '');
      setValue('');
      setDescription(secret?.description || '');
      setShowValue(false);
      setError(null);
    }
  }, [secret, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to SCREAMING_SNAKE_CASE
    const newValue = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '')
      .replace(/^[0-9]+/, ''); // Remove leading numbers
    setName(newValue);
  };

  const handleSave = async () => {
    setError(null);

    // Basic validation
    if (!name.trim()) {
      setError('Secret name is required');
      return;
    }
    // Validate SCREAMING_SNAKE_CASE
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
      setError('Name must be SCREAMING_SNAKE_CASE (uppercase letters, numbers, underscores; must start with letter)');
      return;
    }
    // Value required for new secrets
    if (!secret && !value.trim()) {
      setError('Secret value is required');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        value: value.trim() || undefined,
        description: description.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save secret');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent $sm={{ maxWidth: 512 }}>
        <DialogHeader>
          <DialogTitle>
            {secret ? 'Edit Secret' : 'Create Secret'}
          </DialogTitle>
          <DialogDescription>
            Store sensitive values like API keys securely. Edge functions can access them via secrets.get('{name || 'NAME'}').
          </DialogDescription>
        </DialogHeader>

        <YStack rowGap="$4">
          {/* Name */}
          <YStack rowGap="$2">
            <Label htmlFor="name">Secret Name</Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="HANZO_COMMERCE_API_KEY"
              disabled={!!secret}
              fontFamily="$mono"
  />
            <Paragraph fontSize="$1" color="$color11">
              Use SCREAMING_SNAKE_CASE (e.g., API_KEY, SENDGRID_TOKEN)
            </Paragraph>
          </YStack>

          {/* Value */}
          <YStack rowGap="$2">
            <Label htmlFor="value">
              {secret ? 'New Value (leave empty to keep current)' : 'Secret Value'}
            </Label>
            <YStack position="relative">
              <Input
                id="value"
                type={showValue ? 'text' : 'password'}
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={secret ? 'Enter new value to change...' : 'hzc_live_...'}
                paddingRight="$7" fontFamily="$mono"
  />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                position="absolute" right="$1" top="50%" y="-50%" padding="$0"
                onClick={() => setShowValue(!showValue)}
              >
                {showValue ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </Button>
            </YStack>
            <Paragraph fontSize="$1" color="$color11">
              {secret
                ? 'Leave empty to keep the existing value'
                : 'This value will be encrypted and never displayed again'}
            </Paragraph>
          </YStack>

          {/* Description */}
          <YStack rowGap="$2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Production Hanzo Commerce API key"
  />
          </YStack>

          {/* Usage Reference */}
          <YStack backgroundColor="$color3" borderWidth={1} borderRadius="$5" padding="$4" rowGap="$2">
            <XStack alignItems="center" gap="$2">
              <Info size={16} />
              <SizableText fontSize="$3" fontWeight="500">Usage in Edge Functions</SizableText>
            </XStack>
            <SizableText fontSize="$1" fontFamily="$mono" backgroundColor="$background" padding="$2" borderRadius="$2" overflow="scroll" whiteSpace="pre">
{`// Get secret value
const apiKey = secrets.get('${name || 'HANZO_COMMERCE_API_KEY'}');

// Check if secret exists
if (secrets.has('${name || 'HANZO_COMMERCE_API_KEY'}')) {
  // Use the secret
}

// List all available secrets
const allSecrets = secrets.list(); // ['${name || 'HANZO_COMMERCE_API_KEY'}', ...]`}
            </SizableText>
          </YStack>

          {/* Error */}
          {error && (
            <XStack alignItems="center" gap="$2" backgroundColor="$red9" padding="$3" borderRadius="$5">
              <AlertCircle size={16} />
              <SizableText fontSize="$3" color="$red9">{error}</SizableText>
            </XStack>
          )}
        </YStack>

        {/* Footer */}
        <XStack alignItems="center" justifyContent="flex-end" gap="$2" paddingTop="$4" borderTopWidth={1}>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Spinner size={16} />
                Saving...
              </>
            ) : (
              secret ? 'Save Changes' : 'Create Secret'
            )}
          </Button>
        </XStack>
      </DialogContent>
    </Dialog>
  );
}
