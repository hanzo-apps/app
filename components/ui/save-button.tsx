'use client';

import React from 'react';
import { Save, Check, Loader2 } from 'lucide-react';
import { saveManager } from '@/lib/vfs/save-manager';

interface SaveButtonProps {
  projectId: string;
  className?: string;
  onSave?: (success: boolean) => void;
}

export function SaveButton({ projectId, className = '', onSave }: SaveButtonProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    // Subscribe to dirty state changes
    const unsubscribe = saveManager.subscribe((event) => {
      if (event.projectId === projectId) {
        setIsDirty(event.dirty);
      }
    });

    // Initialize dirty state
    setIsDirty(saveManager.isDirty(projectId));

    return unsubscribe;
  }, [projectId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveManager.save(projectId);
      setJustSaved(true);
      onSave?.(true);

      // Show "saved" indicator for 2 seconds
      setTimeout(() => {
        setJustSaved(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      onSave?.(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={isSaving || (!isDirty && !justSaved)}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        justSaved
          ? 'bg-green-600 text-white'
          : isSaving
          ? 'bg-muted text-muted-foreground cursor-not-allowed'
          : isDirty
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-muted text-muted-foreground cursor-not-allowed'
      } ${className}`}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : justSaved ? (
        <>
          <Check className="h-4 w-4" />
          Saved
        </>
      ) : (
        <>
          <Save className="h-4 w-4" />
          Save
          {isDirty && <span className="ml-1 h-2 w-2 rounded-full bg-current" />}
        </>
      )}
    </button>
  );
}

interface AutoSaveIndicatorProps {
  projectId: string;
  className?: string;
}

export function AutoSaveIndicator({ projectId, className = '' }: AutoSaveIndicatorProps) {
  const [isDirty, setIsDirty] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const unsubscribe = saveManager.subscribe((event) => {
      if (event.projectId === projectId) {
        setIsDirty(event.dirty);
        if (!event.dirty) {
          setLastSaved(new Date());
        }
      }
    });

    setIsDirty(saveManager.isDirty(projectId));

    return unsubscribe;
  }, [projectId]);

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`inline-flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
      {isDirty ? (
        <>
          <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
          Unsaved changes
        </>
      ) : lastSaved ? (
        <>
          <Check className="h-3 w-3 text-green-600" />
          Saved {getTimeAgo(lastSaved)}
        </>
      ) : (
        <>
          <Check className="h-3 w-3 text-green-600" />
          All changes saved
        </>
      )}
    </div>
  );
}
