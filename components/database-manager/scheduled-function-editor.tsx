'use client';

import { YStack, Paragraph, SizableText, XStack } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { ScheduledFunction, EdgeFunction } from '@/lib/vfs/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import { AlertCircle, Info } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface ScheduledFunctionEditorProps {
  scheduledFunction: ScheduledFunction | null;
  edgeFunctions: EdgeFunction[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ScheduledFunction>) => Promise<void>;
}

export function ScheduledFunctionEditor({
  scheduledFunction: fn,
  edgeFunctions,
  isOpen,
  onClose,
  onSave,
}: ScheduledFunctionEditorProps) {
  const [name, setName] = useState(fn?.name || '');
  const [functionId, setFunctionId] = useState(fn?.functionId || '');
  const [cronExpression, setCronExpression] = useState(fn?.cronExpression || '');
  const [timezone, setTimezone] = useState(fn?.timezone || 'UTC');
  const [description, setDescription] = useState(fn?.description || '');
  const [config, setConfig] = useState(fn?.config ? JSON.stringify(fn.config, null, 2) : '{}');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(fn?.name || '');
      setFunctionId(fn?.functionId || '');
      setCronExpression(fn?.cronExpression || '');
      setTimezone(fn?.timezone || 'UTC');
      setDescription(fn?.description || '');
      setConfig(fn?.config ? JSON.stringify(fn.config, null, 2) : '{}');
      setError(null);
    }
  }, [fn, isOpen]);

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(name)) {
      setError('Name must be lowercase letters, numbers, and hyphens only');
      return;
    }
    if (!functionId) {
      setError('Edge function selection is required');
      return;
    }
    if (!cronExpression.trim()) {
      setError('Cron expression is required');
      return;
    }

    let parsedConfig: Record<string, unknown> = {};
    if (config.trim()) {
      try {
        const parsed = JSON.parse(config);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setError('Config must be a JSON object');
          return;
        }
        parsedConfig = parsed;
      } catch {
        setError('Config must be valid JSON');
        return;
      }
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        functionId,
        cronExpression: cronExpression.trim(),
        timezone: timezone.trim() || 'UTC',
        description: description.trim() || undefined,
        config: parsedConfig,
        enabled: fn?.enabled ?? true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scheduled function');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent maxHeight="85vh" flexDirection="column" $sm={{ maxWidth: 512 }}>
        <DialogHeader>
          <DialogTitle>
            {fn ? 'Edit Schedule' : 'Create Schedule'}
          </DialogTitle>
          <DialogDescription>
            Run an edge function on a cron schedule.
          </DialogDescription>
        </DialogHeader>

        <YStack flex={1} overflow="scroll" rowGap="$4">
          {/* Name */}
          <YStack rowGap="$2">
            <Label htmlFor="sched-name">Name</Label>
            <Input
              id="sched-name"
              value={name}
              onChange={e => setName(e.target.value.toLowerCase())}
              placeholder="daily-report"
              disabled={!!fn}
  />
          </YStack>

          {/* Edge Function */}
          <YStack rowGap="$2">
            <Label htmlFor="sched-function">Edge Function</Label>
            <Select value={functionId} onValueChange={setFunctionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a function..." />
              </SelectTrigger>
              <SelectContent>
                {edgeFunctions.map(ef => (
                  <SelectItem key={ef.id} value={ef.id}>
                    {ef.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {edgeFunctions.length === 0 && (
              <Paragraph fontSize="$1" color="$color11">
                No edge functions available. Create one in the Functions tab first.
              </Paragraph>
            )}
          </YStack>

          {/* Cron Expression */}
          <YStack rowGap="$2">
            <Label htmlFor="sched-cron">Cron Expression</Label>
            <Input
              id="sched-cron"
              value={cronExpression}
              onChange={e => setCronExpression(e.target.value)}
              placeholder="0 8 * * *"
              fontFamily="$mono"
  />
          </YStack>

          {/* Timezone */}
          <YStack rowGap="$2">
            <Label htmlFor="sched-tz">Timezone</Label>
            <Input
              id="sched-tz"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              placeholder="UTC"
  />
            <Paragraph fontSize="$1" color="$color11">
              e.g. UTC, America/New_York, Europe/London
            </Paragraph>
          </YStack>

          {/* Description */}
          <YStack rowGap="$2">
            <Label htmlFor="sched-desc">Description (optional)</Label>
            <Input
              id="sched-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this schedule do?"
  />
          </YStack>

          {/* Config */}
          <YStack rowGap="$2">
            <Label htmlFor="sched-config">Config JSON (optional)</Label>
            <Textarea
              id="sched-config"
              value={config}
              onChange={e => setConfig(e.target.value)}
              placeholder="{}"
              fontFamily="$mono" fontSize="$3" height="$11"
  />
            <Paragraph fontSize="$1" color="$color11">
              Custom data passed as the request body to the edge function.
            </Paragraph>
          </YStack>

          {/* Cron Reference */}
          <YStack backgroundColor="$color3" borderWidth={1} borderRadius="$5" padding="$4" rowGap="$2">
            <XStack alignItems="center" gap="$2">
              <Info size={16} />
              <SizableText fontSize="$3" fontWeight="500">Cron Patterns</SizableText>
              <SizableText fontWeight="400" color="$color11">(minimum 5 min interval)</SizableText>
            </XStack>
            <YStack gap="$1">
              <SizableText fontFamily="$mono" fontSize="$1"><SizableText color="$color11">*/5 * * * *</SizableText>  Every 5 minutes</SizableText>
              <SizableText fontFamily="$mono" fontSize="$1"><SizableText color="$color11">0 * * * *</SizableText>    Every hour</SizableText>
              <SizableText fontFamily="$mono" fontSize="$1"><SizableText color="$color11">0 8 * * *</SizableText>    Daily at 8am</SizableText>
              <SizableText fontFamily="$mono" fontSize="$1"><SizableText color="$color11">0 0 * * 1</SizableText>    Every Monday at midnight</SizableText>
              <SizableText fontFamily="$mono" fontSize="$1"><SizableText color="$color11">0 0 1 * *</SizableText>    First of every month</SizableText>
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
                <Spinner size={16} />
                Saving...
              </>
            ) : (
              fn ? 'Save Changes' : 'Create Schedule'
            )}
          </Button>
        </XStack>
      </DialogContent>
    </Dialog>
  );
}
