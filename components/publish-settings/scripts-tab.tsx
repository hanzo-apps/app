'use client';

import { YStack, XStack, H3, Paragraph, H4 } from '@hanzo/gui';
import { useState } from 'react';
import { PublishSettings, ScriptConfig } from '@/lib/vfs/types';
import { Button, Input, Label, Textarea, Switch, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import { Plus, Edit, Trash2, Code } from 'lucide-react';

interface ScriptsTabProps {
  settings: PublishSettings;
  onChange: (settings: PublishSettings) => void;
}

export function ScriptsTab({ settings, onChange }: ScriptsTabProps) {
  const [editingScript, setEditingScript] = useState<ScriptConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scriptPosition, setScriptPosition] = useState<'head' | 'body'>('head');

  const allScripts = [
    ...settings.headScripts.map(s => ({ ...s, position: 'head' as const })),
    ...settings.bodyScripts.map(s => ({ ...s, position: 'body' as const })),
  ];

  const handleAddScript = () => {
    const newScript: ScriptConfig = {
      id: `script-${Date.now()}`,
      name: '',
      content: '',
      type: 'inline',
      enabled: true,
    };
    setEditingScript(newScript);
    setScriptPosition('head');
    setIsDialogOpen(true);
  };

  const handleEditScript = (script: ScriptConfig, position: 'head' | 'body') => {
    setEditingScript(script);
    setScriptPosition(position);
    setIsDialogOpen(true);
  };

  const handleDeleteScript = (scriptId: string) => {
    if (!confirm('Are you sure you want to delete this script?')) return;

    onChange({
      ...settings,
      headScripts: settings.headScripts.filter(s => s.id !== scriptId),
      bodyScripts: settings.bodyScripts.filter(s => s.id !== scriptId),
    });
  };

  const handleToggleScript = (scriptId: string, position: 'head' | 'body') => {
    const scripts = position === 'head' ? settings.headScripts : settings.bodyScripts;
    const updatedScripts = scripts.map(s =>
      s.id === scriptId ? { ...s, enabled: !s.enabled } : s
    );

    onChange({
      ...settings,
      [position === 'head' ? 'headScripts' : 'bodyScripts']: updatedScripts,
    });
  };

  const handleSaveScript = () => {
    if (!editingScript || !editingScript.name.trim()) {
      alert('Please provide a name for the script');
      return;
    }

    const targetArray = scriptPosition === 'head' ? settings.headScripts : settings.bodyScripts;
    const otherArray = scriptPosition === 'head' ? settings.bodyScripts : settings.headScripts;

    // Check if editing existing or creating new
    const existingIndex = targetArray.findIndex(s => s.id === editingScript.id);
    let updatedScripts;

    if (existingIndex >= 0) {
      // Update existing
      updatedScripts = [...targetArray];
      updatedScripts[existingIndex] = editingScript;
    } else {
      // Check if it exists in the other position
      const existsInOther = otherArray.some(s => s.id === editingScript.id);
      if (existsInOther) {
        // Move from other position to current
        const filtered = otherArray.filter(s => s.id !== editingScript.id);
        onChange({
          ...settings,
          [scriptPosition === 'head' ? 'headScripts' : 'bodyScripts']: [...targetArray, editingScript],
          [scriptPosition === 'head' ? 'bodyScripts' : 'headScripts']: filtered,
        });
        setIsDialogOpen(false);
        setEditingScript(null);
        return;
      } else {
        // Add new
        updatedScripts = [...targetArray, editingScript];
      }
    }

    onChange({
      ...settings,
      [scriptPosition === 'head' ? 'headScripts' : 'bodyScripts']: updatedScripts,
    });

    setIsDialogOpen(false);
    setEditingScript(null);
  };

  return (
    <YStack rowGap="$5">
      <XStack alignItems="center" justifyContent="space-between">
        <div>
          <H3 fontSize="$6" fontWeight="500">Script Management</H3>
          <Paragraph fontSize="$3" color="$color11">
            Add custom scripts to your published deployment
          </Paragraph>
        </div>
        <Button onClick={handleAddScript} size="sm">
          <Plus size={16} />
          Add Script
        </Button>
      </XStack>

      {allScripts.length === 0 ? (
        <YStack padding="$6" borderWidth={2} borderStyle="dashed" borderRadius="$5">
          <Code size={48} color="$color11" />
          <H3 fontSize="$6" fontWeight="500" marginBottom="$2" textAlign="center">No Scripts Added</H3>
          <Paragraph fontSize="$3" color="$color11" marginBottom="$4" textAlign="center">
            Add tracking scripts, analytics, or custom code to your deployment
          </Paragraph>
          <Button onClick={handleAddScript} variant="outline">
            <Plus size={16} />
            Add Your First Script
          </Button>
        </YStack>
      ) : (
        <YStack rowGap="$4">
          {allScripts.map((script) => (
            <XStack
              key={script.id}
              alignItems="flex-start" gap="$4" padding="$4" borderWidth={1} borderRadius="$5" hoverStyle={{ backgroundColor: "$color3" }}
            >
              <YStack flex={1} minWidth={0}>
                <XStack alignItems="center" gap="$2" marginBottom="$2">
                  <H4 fontWeight="500" numberOfLines={1}>{script.name}</H4>
                  <Badge variant={script.position === 'head' ? 'default' : 'secondary'}>
                    {script.position === 'head' ? '<head>' : 'before </body>'}
                  </Badge>
                  <Badge variant="outline">
                    {script.type}
                  </Badge>
                  {script.async && <Badge variant="outline">async</Badge>}
                  {script.defer && <Badge variant="outline">defer</Badge>}
                </XStack>
                <Paragraph fontSize="$3" color="$color11" numberOfLines={1}>
                  {script.type === 'inline'
                    ? `${script.content.length} characters`
                    : script.content}
                </Paragraph>
              </YStack>
              <XStack alignItems="center" gap="$2">
                <Switch
                  checked={script.enabled}
                  onCheckedChange={() => handleToggleScript(script.id, script.position)}
  />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditScript(script, script.position)}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteScript(script.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </XStack>
            </XStack>
          ))}
        </YStack>
      )}

      {/* Script Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent maxWidth={672}>
          <DialogHeader>
            <DialogTitle>
              {editingScript?.name ? 'Edit Script' : 'Add Script'}
            </DialogTitle>
            <DialogDescription>
              Configure a custom script to inject into your published deployment
            </DialogDescription>
          </DialogHeader>

          {editingScript && (
            <YStack rowGap="$4">
              <YStack rowGap="$2">
                <Label htmlFor="script-name">Script Name</Label>
                <Input
                  id="script-name"
                  placeholder="e.g., Google Analytics"
                  value={editingScript.name}
                  onChange={(e) =>
                    setEditingScript({ ...editingScript, name: e.target.value })
                  }
  />
              </YStack>

              <YStack gap="$4">
                <YStack rowGap="$2">
                  <Label htmlFor="script-position">Position</Label>
                  <Select
                    value={scriptPosition}
                    onValueChange={(value: 'head' | 'body') => setScriptPosition(value)}
                  >
                    <SelectTrigger id="script-position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="head">In &lt;head&gt;</SelectItem>
                      <SelectItem value="body">Before &lt;/body&gt;</SelectItem>
                    </SelectContent>
                  </Select>
                </YStack>

                <YStack rowGap="$2">
                  <Label htmlFor="script-type">Type</Label>
                  <Select
                    value={editingScript.type}
                    onValueChange={(value: 'inline' | 'external') =>
                      setEditingScript({ ...editingScript, type: value })
                    }
                  >
                    <SelectTrigger id="script-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inline">Inline Script</SelectItem>
                      <SelectItem value="external">External URL</SelectItem>
                    </SelectContent>
                  </Select>
                </YStack>
              </YStack>

              <YStack rowGap="$2">
                <Label htmlFor="script-content">
                  {editingScript.type === 'inline' ? 'Script Code' : 'Script URL'}
                </Label>
                {editingScript.type === 'inline' ? (
                  <Textarea
                    id="script-content"
                    placeholder="<script>...</script>"
                    rows={8}
                    value={editingScript.content}
                    onChange={(e) =>
                      setEditingScript({ ...editingScript, content: e.target.value })
                    }
                    fontFamily="$mono" fontSize="$3"
  />
                ) : (
                  <Input
                    id="script-content"
                    type="url"
                    placeholder="https://example.com/script.js"
                    value={editingScript.content}
                    onChange={(e) =>
                      setEditingScript({ ...editingScript, content: e.target.value })
                    }
  />
                )}
              </YStack>

              {editingScript.type === 'external' && (
                <XStack gap="$4">
                  <XStack alignItems="center" columnGap="$2">
                    <Switch
                      id="script-async"
                      checked={editingScript.async || false}
                      onCheckedChange={(checked) =>
                        setEditingScript({ ...editingScript, async: checked })
                      }
  />
                    <Label htmlFor="script-async">Async</Label>
                  </XStack>
                  <XStack alignItems="center" columnGap="$2">
                    <Switch
                      id="script-defer"
                      checked={editingScript.defer || false}
                      onCheckedChange={(checked) =>
                        setEditingScript({ ...editingScript, defer: checked })
                      }
  />
                    <Label htmlFor="script-defer">Defer</Label>
                  </XStack>
                </XStack>
              )}
            </YStack>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveScript}>Save Script</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </YStack>
  );
}
