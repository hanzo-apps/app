'use client';

import { YStack, Image, Paragraph, XStack, SizableText } from '@hanzo/gui';
import React, { useState } from 'react';
import { Project, LICENSE_OPTIONS } from '@/lib/vfs/types';
import { vfs } from '@/lib/vfs';
import { templateService, TemplateMetadata } from '@/lib/vfs/template-service';
import { Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, toast } from '@hanzo/ui';
import { logger } from '@/lib/utils';
import { Info, FileBox } from 'lucide-react';

interface TemplateExportDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateExportDialog({
  project,
  open,
  onOpenChange,
}: TemplateExportDialogProps) {
  const [exporting, setExporting] = useState(false);
  const [metadata, setMetadata] = useState<TemplateMetadata>({
    name: project?.name || '',
    description: project?.description || '',
    version: '1.0.0',
    author: '',
    authorUrl: '',
    license: 'personal',
    tags: [],
    thumbnail: undefined,
    previewImages: [],
    downloadUrl: ''
  });
  const [tagsInput, setTagsInput] = useState('');

  const handleExport = async () => {
    if (!project) return;

    // Validate required fields
    if (!metadata.name || metadata.name.length < 1 || metadata.name.length > 50) {
      toast.error('Template name must be between 1 and 50 characters');
      return;
    }

    if (!metadata.description || metadata.description.length < 10 || metadata.description.length > 500) {
      toast.error('Description must be between 10 and 500 characters');
      return;
    }

    if (!metadata.version || !/^\d+\.\d+\.\d+$/.test(metadata.version)) {
      toast.error('Version must be in format x.y.z (e.g., 1.0.0)');
      return;
    }

    try {
      setExporting(true);

      // Parse tags
      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const exportMetadata = {
        ...metadata,
        tags
      };

      // Export template
      const blob = await templateService.exportProjectAsTemplate(
        vfs,
        project.id,
        exportMetadata
      );

      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${metadata.name.replace(/\s+/g, '-').toLowerCase()}.oswt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Template exported successfully!');
      onOpenChange(false);

      // Reset form
      setMetadata({
        name: '',
        description: '',
        version: '1.0.0',
        author: '',
        authorUrl: '',
        license: 'personal',
        tags: [],
        thumbnail: undefined,
        previewImages: [],
        downloadUrl: ''
      });
      setTagsInput('');
    } catch (error) {
      logger.error('Failed to export template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export template');
    } finally {
      setExporting(false);
    }
  };

  // Update form when project changes
  React.useEffect(() => {
    if (project && open) {
      setMetadata(prev => ({
        ...prev,
        name: project.name,
        description: project.description || '',
        // Use project preview as default thumbnail if available
        thumbnail: project.previewImage || prev.thumbnail
      }));
    }
  }, [project, open]);

  const selectedLicense = LICENSE_OPTIONS.find(opt => opt.value === metadata.license);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth={672} maxHeight="90vh" overflow="scroll">
        <DialogHeader>
          <DialogTitle>Export as Template</DialogTitle>
          <DialogDescription>
            Create a reusable template from this project
          </DialogDescription>
        </DialogHeader>

        <YStack rowGap="$4" paddingVertical="$4">
          {/* Preview Thumbnail */}
          {metadata.thumbnail && (
            <YStack rowGap="$2">
              <Label>Preview Thumbnail</Label>
              <YStack width="100%" borderRadius="$5" overflow="hidden" backgroundColor="$color3" borderWidth={1}>
                <Image
                  src={metadata.thumbnail}
                  alt="Template preview"
                  width="100%" height="auto"
  />
              </YStack>
              <Paragraph fontSize="$1" color="$color11">
                This preview was captured when you saved the project
              </Paragraph>
            </YStack>
          )}

          {!metadata.thumbnail && (
            <YStack rowGap="$2">
              <Label>Preview Thumbnail</Label>
              <XStack width="100%" height="$19" borderRadius="$5" backgroundColor="$color3" alignItems="center" justifyContent="center" borderWidth={1}>
                <SizableText textAlign="center" color="$color11" display="flex" flexDirection="column">
                  <FileBox size={48} />
                  <Paragraph fontSize="$3">No preview available</Paragraph>
                  <Paragraph fontSize="$1">Save your project to capture a preview</Paragraph>
                </SizableText>
              </XStack>
            </YStack>
          )}

          {/* Name */}
          <YStack rowGap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Label htmlFor="template-name">
                Template Name <SizableText color="$red9">*</SizableText>
              </Label>
              <SizableText fontSize="$1" color="$color11">
                {metadata.name.length}/50
              </SizableText>
            </XStack>
            <Input
              id="template-name"
              value={metadata.name}
              onChangeText={(value) => setMetadata({ ...metadata, name: value.slice(0, 50) })}
              placeholder="My Awesome Template"
              maxLength={50}
              required
  />
          </YStack>

          {/* Description */}
          <YStack rowGap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Label htmlFor="template-description">
                Description <SizableText color="$red9">*</SizableText>
              </Label>
              <SizableText fontSize="$1" color="$color11">
                {metadata.description.length}/500
              </SizableText>
            </XStack>
            <Textarea
              id="template-description"
              value={metadata.description}
              onChangeText={(value) => setMetadata({ ...metadata, description: value.slice(0, 500) })}
              placeholder="A complete multi-page template with..."
              rows={3}
              maxLength={500}
              required
  />
          </YStack>

          {/* Version */}
          <YStack rowGap="$2">
            <Label htmlFor="template-version">
              Version <SizableText color="$red9">*</SizableText>
            </Label>
            <Input
              id="template-version"
              value={metadata.version}
              onChangeText={(value) => setMetadata({ ...metadata, version: value })}
              placeholder="1.0.0"
              pattern="^\d+\.\d+\.\d+$"
              required
  />
            <Paragraph fontSize="$1" color="$color11">
              Semantic version format (e.g., 1.0.0)
            </Paragraph>
          </YStack>

          {/* Author */}
          <YStack rowGap="$2">
            <Label htmlFor="template-author">Author</Label>
            <Input
              id="template-author"
              value={metadata.author}
              onChangeText={(value) => setMetadata({ ...metadata, author: value.slice(0, 50) })}
              placeholder="Your Name"
              maxLength={50}
  />
          </YStack>

          {/* Author URL */}
          <YStack rowGap="$2">
            <Label htmlFor="template-author-url">Author URL</Label>
            <Input
              id="template-author-url"
              type="url"
              value={metadata.authorUrl}
              onChangeText={(value) => setMetadata({ ...metadata, authorUrl: value })}
              placeholder="https://yourwebsite.com"
  />
          </YStack>

          {/* License */}
          <YStack rowGap="$2">
            <Label htmlFor="template-license">
              License <SizableText color="$red9">*</SizableText>
            </Label>
            <Select
              value={metadata.license}
              onValueChange={(value) => setMetadata({ ...metadata, license: value })}
            >
              <SelectTrigger id="template-license">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLicense && (
              <SizableText alignItems="flex-start" gap="$2" padding="$2" borderRadius="$3" backgroundColor="$color3" fontSize="$1" display="flex" flexDirection="row">
                <Info size={12} color="$color11" />
                <Paragraph color="$color11">{selectedLicense.description}</Paragraph>
              </SizableText>
            )}
          </YStack>

          {/* Tags */}
          <YStack rowGap="$2">
            <Label htmlFor="template-tags">Tags</Label>
            <Input
              id="template-tags"
              value={tagsInput}
              onChangeText={(value) => setTagsInput(value)}
              placeholder="saas, marketing, landing (comma-separated)"
  />
            <Paragraph fontSize="$1" color="$color11">
              Add up to 10 tags, separated by commas
            </Paragraph>
          </YStack>

          {/* Marketplace URL */}
          <YStack rowGap="$2">
            <Label htmlFor="template-download-url">Marketplace URL</Label>
            <Input
              id="template-download-url"
              type="url"
              value={metadata.downloadUrl}
              onChangeText={(value) => setMetadata({ ...metadata, downloadUrl: value })}
              placeholder="https://example.com/templates/..."
  />
            <Paragraph fontSize="$1" color="$color11">
              Where users can find this template
            </Paragraph>
          </YStack>
        </YStack>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
