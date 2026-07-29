'use client';

import { YStack, Paragraph, SizableText, XStack } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { CodeEditor } from '@/components/code-editor';
import { ServerFunction } from '@/lib/vfs/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Button, Input, Label } from '@hanzo/ui';
import { Loader2, AlertCircle, Info } from 'lucide-react';

interface ServerFunctionEditorProps {
  function: ServerFunction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ServerFunction>) => Promise<void>;
}

const DEFAULT_CODE = `// Server functions receive arguments via the 'args' array
// and have access to 'db' and 'fetch'

// Example: Validate an API key
const [apiKey] = args;
if (!apiKey) {
  return { valid: false, error: 'No API key provided' };
}

const users = db.query(
  'SELECT id, name FROM users WHERE api_key = ?',
  [apiKey]
);

if (users.length === 0) {
  return { valid: false, error: 'Invalid API key' };
}

return { valid: true, user: users[0] };
`;

export function ServerFunctionEditor({
  function: fn,
  isOpen,
  onClose,
  onSave,
}: ServerFunctionEditorProps) {
  const [name, setName] = useState(fn?.name || '');
  const [description, setDescription] = useState(fn?.description || '');
  const [code, setCode] = useState(fn?.code || DEFAULT_CODE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName(fn?.name || '');
      setDescription(fn?.description || '');
      setCode(fn?.code || DEFAULT_CODE);
      setError(null);
    }
  }, [fn, isOpen]);

  const handleSave = async () => {
    setError(null);

    // Basic validation
    if (!name.trim()) {
      setError('Function name is required');
      return;
    }
    // Validate JS identifier (camelCase or snake_case)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      setError('Name must be a valid identifier (letters, numbers, underscores; cannot start with number)');
      return;
    }
    // Check reserved names
    const reserved = ['db', 'fetch', 'console', 'args', 'request', 'Response', 'server'];
    if (reserved.includes(name)) {
      setError(`"${name}" is reserved and cannot be used`);
      return;
    }
    if (!code.trim()) {
      setError('Function code is required');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        code,
        enabled: fn?.enabled ?? true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save server function');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent height="85vh" flexDirection="column" $sm={{ maxWidth: 768 }}>
        <DialogHeader>
          <DialogTitle>
            {fn ? 'Edit Server Function' : 'Create Server Function'}
          </DialogTitle>
          <DialogDescription>
            Define a reusable helper function that edge functions can call via server.{name || 'name'}(args).
          </DialogDescription>
        </DialogHeader>

        <YStack flex={1} overflow="scroll" rowGap="$4">
          {/* Name */}
          <YStack rowGap="$2">
            <Label htmlFor="name">Function Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="validateAuth"
              disabled={!!fn}
  />
            <Paragraph fontSize="$1" color="$color11">
              Usage in edge functions: <SizableText fontFamily="$mono">server.{name || 'name'}(arg1, arg2, ...)</SizableText>
            </Paragraph>
          </YStack>

          {/* Description */}
          <YStack rowGap="$2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this helper do?"
  />
          </YStack>

          {/* Code Editor */}
          <YStack rowGap="$2">
            <Label>Function Code</Label>
            <YStack height={256} borderWidth={1} borderRadius="$5" overflow="hidden">
              <CodeEditor
                language="javascript"
                value={code}
                onChange={(value) => setCode(value)}
  />
            </YStack>
          </YStack>

          {/* API Reference */}
          <YStack backgroundColor="$color3" borderWidth={1} borderRadius="$5" padding="$4" rowGap="$2">
            <SizableText alignItems="center" gap="$2" fontSize="$3" fontWeight="500" display="flex" flexDirection="row">
              <Info size={16} />
              Available in Server Functions
            </SizableText>
            <SizableText gap="$2" fontSize="$1" fontFamily="$mono" display="flex" flexDirection="column">
              <div><SizableText color="$orange9">args</SizableText> - Array of arguments passed from edge function</div>
              <div><SizableText color="$green9">db</SizableText>.query(sql, params), .run(sql, params), .all(sql, params)</div>
              <div><SizableText color="$yellow9">fetch</SizableText>(url, options) - External HTTP requests</div>
              <div><SizableText color="$blue9">console</SizableText>.log(), .error(), .warn() - Logging</div>
            </SizableText>
            <YStack marginTop="$3" paddingTop="$3" borderTopWidth={1}>
              <Paragraph fontSize="$1" color="$color11">
                <strong>Note:</strong> Return a value to send data back to the calling edge function.
                Server functions are synchronous and share the timeout with the parent edge function.
              </Paragraph>
            </YStack>
          </YStack>

          {/* Example */}
          <YStack backgroundColor="$color3" borderWidth={1} borderRadius="$5" padding="$4" rowGap="$2">
            <SizableText fontSize="$3" fontWeight="500" display="flex" flexDirection="column">Example: Using in Edge Function</SizableText>
            <SizableText fontSize="$1" fontFamily="$mono" backgroundColor="$background" padding="$2" borderRadius="$2" overflow="scroll" whiteSpace="pre">
{`// Edge function code
const auth = server.${name || 'validateAuth'}(request.headers['x-api-key']);
if (!auth.valid) {
  Response.error(auth.error, 401);
  return;
}

// User is authenticated
const products = db.query('SELECT * FROM products WHERE user_id = ?', [auth.user.id]);
Response.json({ products });`}
            </SizableText>
          </YStack>

          {/* Error */}
          {error && (
            <SizableText alignItems="center" gap="$2" fontSize="$3" color="$red9" backgroundColor="$red9" padding="$3" borderRadius="$5" display="flex" flexDirection="row">
              <AlertCircle size={16} />
              {error}
            </SizableText>
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
                <Loader2 size={16} />
                Saving...
              </>
            ) : (
              fn ? 'Save Changes' : 'Create Function'
            )}
          </Button>
        </XStack>
      </DialogContent>
    </Dialog>
  );
}
