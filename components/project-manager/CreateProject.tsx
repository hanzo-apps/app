'use client';

import React, { useState } from 'react';
import { Button } from '@hanzo/ui';
import { Input } from '@/components/control';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/overlay';
import {
  createProject,
  FRAMEWORKS,
  type Framework,
  type CreateProjectPayload,
  type Project,
} from '@/lib/api/projects';

// --- Radix wrappers (matching project conventions) ---

const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = 'DialogContent';

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
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <DialogPrimitive.Title className="text-lg font-medium leading-none tracking-tight">
            Create New Project
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm text-muted-foreground">
            Configure your new project and deploy it to the Hanzo platform.
          </DialogPrimitive.Description>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="create-name" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="create-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 64))}
              placeholder="my-project"
              className="mt-1.5"
              maxLength={64}
              disabled={submitting}
            />
            <span className="text-xs text-muted-foreground">{name.length}/64</span>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="create-desc" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="create-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 256))}
              placeholder="A brief description of your project"
              className="mt-1.5"
              maxLength={256}
              disabled={submitting}
            />
            <span className="text-xs text-muted-foreground">{description.length}/256</span>
          </div>

          {/* Framework */}
          <div>
            <label className="text-sm font-medium">Framework</label>
            <Select value={framework} onValueChange={(v) => setFramework(v as Framework)} disabled={submitting}>
              <SelectTrigger className="mt-1.5 bg-card">
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
            <p className="text-xs text-muted-foreground mt-1">
              How the site is built. &quot;Static&quot; means it&apos;s already built.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
