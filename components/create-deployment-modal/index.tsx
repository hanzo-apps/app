'use client';

import { YStack, Paragraph, SizableText } from '@hanzo/ui';
import { useState } from 'react';
import { Project } from '@/lib/vfs/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';

interface CreateDeploymentModalProps {
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { projectId: string; name: string; slug?: string }) => Promise<void>;
}

export function CreateDeploymentModal({
  projects,
  isOpen,
  onClose,
  onCreate,
}: CreateDeploymentModalProps) {
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!projectId || !name) {
      setError('Pick a project and give the deployment a name.');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await onCreate({
        projectId,
        name,
        slug: slug || undefined,
      });

      // Reset form
      setProjectId('');
      setName('');
      setSlug('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the deployment. Try a different name, or try again in a moment.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setProjectId('');
      setName('');
      setSlug('');
      setError('');
      onClose();
    }
  };

  // Auto-generate deployment name from selected project
  const handleProjectChange = (value: string) => {
    setProjectId(value);
    if (!name) {
      const project = projects.find(p => p.id === value);
      if (project) {
        setName(project.name);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent $sm={{ maxWidth: 500 }}>
        <DialogHeader>
          <DialogTitle>New deployment</DialogTitle>
          <DialogDescription>
            A deployment is a published copy of a project with its own URL and its
            own publish settings. One project can have several.
          </DialogDescription>
        </DialogHeader>

        <YStack gap="$4" paddingVertical="$4">
          {/* Project Selection */}
          <YStack gap="$2">
            <Label htmlFor="project">Project</Label>
            <Select value={projectId} onValueChange={handleProjectChange}>
              <SelectTrigger id="project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Paragraph fontSize="$1" color="$color11">
              The project whose files this deployment serves.
            </Paragraph>
          </YStack>

          {/* Deployment Name */}
          <YStack gap="$2">
            <Label htmlFor="name">Deployment name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production"
  />
            <Paragraph fontSize="$1" color="$color11">
              What you call this deployment in the dashboard.
            </Paragraph>
          </YStack>

          {/* Slug (Optional) */}
          <YStack gap="$2">
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-project"
  />
            <Paragraph fontSize="$1" color="$color11">
              The name in the URL. Leave it blank and one is made from the deployment name.
            </Paragraph>
          </YStack>

          {/* Error Message */}
          {error && (
            <YStack backgroundColor="$red9" padding="$3" borderRadius="$2">
              <SizableText fontSize="$3" color="$red9">
                {error}
              </SizableText>
            </YStack>
          )}
        </YStack>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !projectId || !name}>
            {isCreating ? 'Creating…' : 'Create deployment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
