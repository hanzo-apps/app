'use client';

import { YStack, Paragraph, SizableText, XStack } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { CodeEditor } from '@/components/code-editor';
import { EdgeFunction } from '@/lib/vfs/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import { Loader2, AlertCircle, Info } from 'lucide-react';

interface FunctionEditorProps {
  deploymentId: string;
  function: EdgeFunction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<EdgeFunction>) => Promise<void>;
}

const DEFAULT_CODE = `// Access the request object
// request.method - HTTP method
// request.body - Parsed request body
// request.query - Query string parameters
// request.headers - Request headers

// Use the database
// db.query(sql, params) - Execute SELECT query
// db.run(sql, params) - Execute INSERT/UPDATE/DELETE
// db.all(sql, params) - Alias for query

// Return a response
// Response.json(data, status) - Return JSON
// Response.text(text, status) - Return text
// Response.error(message, status) - Return error

// Example: List items
const items = db.all('SELECT * FROM items LIMIT 10');
Response.json({ items });
`;

export function FunctionEditor({
  deploymentId,
  function: fn,
  isOpen,
  onClose,
  onSave,
}: FunctionEditorProps) {
  const [name, setName] = useState(fn?.name || '');
  const [description, setDescription] = useState(fn?.description || '');
  const [method, setMethod] = useState<EdgeFunction['method']>(fn?.method || 'ANY');
  const [code, setCode] = useState(fn?.code || DEFAULT_CODE);
  const [timeoutMs, setTimeoutMs] = useState(fn?.timeoutMs || 5000);
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
      setMethod(fn?.method || 'ANY');
      setCode(fn?.code || DEFAULT_CODE);
      setTimeoutMs(fn?.timeoutMs || 5000);
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
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(name)) {
      setError('Name must be lowercase letters, numbers, and hyphens only');
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
        method,
        code,
        timeoutMs,
        enabled: fn?.enabled ?? true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save function');
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
            {fn ? 'Edit Function' : 'Create Function'}
          </DialogTitle>
          <DialogDescription>
            Define an HTTP endpoint that can access your deployment database.
          </DialogDescription>
        </DialogHeader>

        <YStack flex={1} overflow="scroll" rowGap="$4">
          {/* Name & Method */}
          <YStack gap="$4">
            <YStack rowGap="$2">
              <Label htmlFor="name">Function Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value.toLowerCase())}
                placeholder="my-function"
                disabled={!!fn}
  />
              {deploymentId && (
                <Paragraph fontSize="$1" color="$color11">
                  URL: /api/deployments/{deploymentId}/functions/<SizableText fontFamily="$mono">{name || 'name'}</SizableText>
                </Paragraph>
              )}
            </YStack>
            <YStack rowGap="$2">
              <Label htmlFor="method">HTTP Method</Label>
              <Select value={method} onValueChange={v => setMethod(v as EdgeFunction['method'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">ANY</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </YStack>
          </YStack>

          {/* Description */}
          <YStack rowGap="$2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this function do?"
  />
          </YStack>

          {/* Timeout */}
          <YStack rowGap="$2">
            <Label htmlFor="timeout">Timeout (seconds)</Label>
            <XStack alignItems="center" gap="$2">
              <Input
                id="timeout"
                type="number"
                min={1}
                max={30}
                value={timeoutMs / 1000}
                onChange={e => setTimeoutMs(Math.min(30, Math.max(1, parseInt(e.target.value) || 5)) * 1000)}
                width="$12"
  />
              <SizableText fontSize="$3" color="$color11">1-30 seconds</SizableText>
            </XStack>
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
            <XStack alignItems="center" gap="$2">
              <Info size={16} />
              <SizableText fontSize="$3" fontWeight="500">Available APIs</SizableText>
            </XStack>
            <YStack gap="$2">
              <SizableText fontSize="$1" fontFamily="$mono"><SizableText color="$blue9">request</SizableText>.method, .body, .query, .headers, .params, .path</SizableText>
              <SizableText fontSize="$1" fontFamily="$mono"><SizableText color="$green9">db</SizableText>.query(sql, params), .run(sql, params), .all(sql, params)</SizableText>
              <SizableText fontSize="$1" fontFamily="$mono"><SizableText color="$purple9">Response</SizableText>.json(data, status), .text(text, status), .error(msg, status)</SizableText>
              <SizableText fontSize="$1" fontFamily="$mono"><SizableText color="$yellow9">fetch</SizableText>(url, options) - External HTTP requests</SizableText>
            </YStack>
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
