'use client';

import { YStack, SizableText, Paragraph, XStack } from '@hanzo/gui';
import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label } from '@hanzo/ui';
import { Loader2 } from 'lucide-react';
import {
  createProject,
  FRAMEWORKS,
  type Framework,
  type CreateProjectPayload,
  type Project,
} from '@/lib/api/projects';

// Dialog comes from @hanzo/ui. The wrappers that used to live here rebuilt what
// it already does — DialogContent self-portals and renders its own overlay — so
// they were a Radix copy of a component the design system ships.
// --- CreateProject Component ---

interface CreateProjectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (project: Project) => void;
}

export function CreateProject({ open, onOpenChange, onCreated }: CreateProjectProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState<Framework>('static');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setFramework('static');
    setError(null);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Project name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateProjectPayload = {
        name: trimmedName,
        description: description.trim(),
        framework,
      };
      const project = await createProject(payload);
      resetForm();
      onOpenChange(false);
      onCreated(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Configure your new project and deploy it to the Hanzo platform.
          </DialogDescription>
        </DialogHeader>

        <YStack rowGap="$4">
          {/* Name */}
          <div>
            <Label htmlFor="create-name" fontSize="$3" fontWeight="500">
              Project Name
            </Label>
            <Input
              id="create-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 64))}
              placeholder="my-project"
              marginTop="$1.5"
              maxLength={64}
              disabled={submitting}
            />
            <SizableText fontSize="$1" color="$color11">{name.length}/64</SizableText>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="create-desc" fontSize="$3" fontWeight="500">
              Description
            </Label>
            <Input
              id="create-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 256))}
              placeholder="A brief description of your project"
              marginTop="$1.5"
              maxLength={256}
              disabled={submitting}
            />
            <SizableText fontSize="$1" color="$color11">{description.length}/256</SizableText>
          </div>

          {/* Framework */}
          <div>
            <Label fontSize="$3" fontWeight="500">Framework</Label>
            <Select value={framework} onValueChange={(v) => setFramework(v as Framework)}>
              <SelectTrigger marginTop="$1.5" backgroundColor="$background" disabled={submitting}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRAMEWORKS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Paragraph fontSize="$1" color="$color11" marginTop="$1">
              How the site is built. &quot;Static&quot; means it&apos;s already built.
            </Paragraph>
          </div>

          {/* Error */}
          {error && (
            <Paragraph fontSize="$3" color="$red9">{error}</Paragraph>
          )}
        </YStack>

        {/* Footer */}
        <XStack $sm={{ flexDirection: "row", justifyContent: "flex-end", columnGap: "$2" }}>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting && <Loader2 size={16} />}
            Create Project
          </Button>
        </XStack>
      </DialogContent>
    </Dialog>
  );
}
