'use client';

import { YStack, XStack, H3, Paragraph, H4 } from '@hanzo/ui';
import { useState } from 'react';
import { PublishSettings, CdnConfig } from '@/lib/vfs/types';
import { Button, Input, Label, Switch, Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import { Plus, Edit, Trash2, Link2 } from 'lucide-react';

interface CdnTabProps {
  settings: PublishSettings;
  onChange: (settings: PublishSettings) => void;
}

export function CdnTab({ settings, onChange }: CdnTabProps) {
  const [editingCdn, setEditingCdn] = useState<CdnConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddCdn = () => {
    const newCdn: CdnConfig = {
      id: `cdn-${Date.now()}`,
      name: '',
      url: '',
      type: 'css',
      enabled: true,
    };
    setEditingCdn(newCdn);
    setIsDialogOpen(true);
  };

  const handleEditCdn = (cdn: CdnConfig) => {
    setEditingCdn(cdn);
    setIsDialogOpen(true);
  };

  const handleDeleteCdn = (cdnId: string) => {
    if (!confirm('Are you sure you want to remove this CDN resource?')) return;

    onChange({
      ...settings,
      cdnLinks: settings.cdnLinks.filter(c => c.id !== cdnId),
    });
  };

  const handleToggleCdn = (cdnId: string) => {
    onChange({
      ...settings,
      cdnLinks: settings.cdnLinks.map(c =>
        c.id === cdnId ? { ...c, enabled: !c.enabled } : c
      ),
    });
  };

  const handleSaveCdn = () => {
    if (!editingCdn || !editingCdn.name.trim() || !editingCdn.url.trim()) {
      alert('Please provide both a name and URL for the CDN resource');
      return;
    }

    // Basic URL validation
    try {
      new URL(editingCdn.url);
    } catch {
      alert('Please provide a valid URL');
      return;
    }

    const existingIndex = settings.cdnLinks.findIndex(c => c.id === editingCdn.id);
    let updatedCdnLinks;

    if (existingIndex >= 0) {
      // Update existing
      updatedCdnLinks = [...settings.cdnLinks];
      updatedCdnLinks[existingIndex] = editingCdn;
    } else {
      // Add new
      updatedCdnLinks = [...settings.cdnLinks, editingCdn];
    }

    onChange({
      ...settings,
      cdnLinks: updatedCdnLinks,
    });

    setIsDialogOpen(false);
    setEditingCdn(null);
  };

  // Auto-detect type from URL
  const autoDetectType = (url: string): 'css' | 'js' => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.css')) return 'css';
    if (lowerUrl.endsWith('.js')) return 'js';
    return 'css';
  };

  return (
    <YStack rowGap="$5">
      <XStack alignItems="center" justifyContent="space-between">
        <div>
          <H3 fontSize="$6" fontWeight="500">CDN Resources</H3>
          <Paragraph fontSize="$3" color="$color11">
            Add external CSS and JavaScript libraries
          </Paragraph>
        </div>
        <Button onClick={handleAddCdn} size="sm">
          <Plus size={16} />
          Add CDN Resource
        </Button>
      </XStack>

      {settings.cdnLinks.length === 0 ? (
        <YStack alignItems="center" padding="$6" borderWidth={2} borderStyle="dashed" borderRadius="$5">
          <Link2 size={48} />
          <H3 fontSize="$6" fontWeight="500" marginBottom="$2" textAlign="center">No CDN Resources</H3>
          <Paragraph fontSize="$3" color="$color11" marginBottom="$4" textAlign="center">
            Add libraries like Bootstrap, Tailwind, or custom stylesheets
          </Paragraph>
          <Button onClick={handleAddCdn} variant="outline">
            <Plus size={16} />
            Add Your First Resource
          </Button>
        </YStack>
      ) : (
        <YStack rowGap="$4">
          {settings.cdnLinks.map((cdn) => (
            <XStack
              key={cdn.id}
              alignItems="flex-start" gap="$4" padding="$4" borderWidth={1} borderColor="$borderColor" borderRadius="$5" hoverStyle={{ backgroundColor: "$color2", borderColor: "$color06" }}
            >
              <YStack flex={1} minWidth={0}>
                <XStack alignItems="center" gap="$2" marginBottom="$2">
                  <H4 fontWeight="500" numberOfLines={1}>{cdn.name}</H4>
                  <Badge variant={cdn.type === 'css' ? 'default' : 'secondary'}>
                    {cdn.type.toUpperCase()}
                  </Badge>
                  {cdn.integrity && <Badge variant="outline">SRI</Badge>}
                  {cdn.crossorigin && (
                    <Badge variant="outline">{cdn.crossorigin}</Badge>
                  )}
                </XStack>
                <Paragraph fontSize="$3" color="$color11" numberOfLines={1}>{cdn.url}</Paragraph>
              </YStack>
              <XStack alignItems="center" gap="$2">
                <Switch
                  checked={cdn.enabled}
                  onCheckedChange={() => handleToggleCdn(cdn.id)}
  />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditCdn(cdn)}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCdn(cdn.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </XStack>
            </XStack>
          ))}
        </YStack>
      )}

      {/* CDN Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent maxWidth={672}>
          <DialogHeader>
            <DialogTitle>
              {editingCdn?.name ? 'Edit CDN Resource' : 'Add CDN Resource'}
            </DialogTitle>
            <DialogDescription>
              Add a CSS or JavaScript library from a CDN
            </DialogDescription>
          </DialogHeader>

          {editingCdn && (
            <YStack rowGap="$4">
              <YStack rowGap="$2">
                <Label htmlFor="cdn-name">Resource Name</Label>
                <Input
                  id="cdn-name"
                  placeholder="e.g., Bootstrap CSS"
                  value={editingCdn.name}
                  onChange={(e) =>
                    setEditingCdn({ ...editingCdn, name: e.target.value })
                  }
  />
              </YStack>

              <YStack rowGap="$2">
                <Label htmlFor="cdn-url">CDN URL</Label>
                <Input
                  id="cdn-url"
                  type="url"
                  placeholder="https://cdn.example.com/library.css"
                  value={editingCdn.url}
                  onChange={(e) => {
                    const url = e.target.value;
                    setEditingCdn({
                      ...editingCdn,
                      url,
                      type: url ? autoDetectType(url) : editingCdn.type,
                    });
                  }}
  />
              </YStack>

              <YStack rowGap="$2">
                <Label htmlFor="cdn-type">Type</Label>
                <Select
                  value={editingCdn.type}
                  onValueChange={(value: 'css' | 'js') =>
                    setEditingCdn({ ...editingCdn, type: value })
                  }
                >
                  <SelectTrigger id="cdn-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="css">CSS Stylesheet</SelectItem>
                    <SelectItem value="js">JavaScript Library</SelectItem>
                  </SelectContent>
                </Select>
              </YStack>

              <YStack rowGap="$2">
                <Label htmlFor="cdn-integrity">
                  SRI Integrity Hash (Optional)
                </Label>
                <Input
                  id="cdn-integrity"
                  placeholder="sha384-..."
                  value={editingCdn.integrity || ''}
                  onChange={(e) =>
                    setEditingCdn({
                      ...editingCdn,
                      integrity: e.target.value || undefined,
                    })
                  }
  />
                <Paragraph fontSize="$1" color="$color11">
                  Subresource Integrity hash for security verification
                </Paragraph>
              </YStack>

              <YStack rowGap="$2">
                <Label htmlFor="cdn-crossorigin">CORS Setting (Optional)</Label>
                <Select
                  value={editingCdn.crossorigin || 'none'}
                  onValueChange={(value) =>
                    setEditingCdn({
                      ...editingCdn,
                      crossorigin:
                        value === 'none'
                          ? undefined
                          : (value as 'anonymous' | 'use-credentials'),
                    })
                  }
                >
                  <SelectTrigger id="cdn-crossorigin">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="anonymous">Anonymous</SelectItem>
                    <SelectItem value="use-credentials">Use Credentials</SelectItem>
                  </SelectContent>
                </Select>
              </YStack>
            </YStack>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCdn}>Save Resource</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </YStack>
  );
}
