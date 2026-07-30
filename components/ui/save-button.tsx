'use client';

import { Button } from '@hanzo/ui';
import { SizableText } from '@hanzo/gui';
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
    <Button
      onClick={handleSave}
      disabled={isSaving || (!isDirty && !justSaved)}
      alignItems="center" gap="$2" paddingHorizontal="$4" paddingVertical="$2" borderRadius="$3" fontSize="$3" fontWeight="500" {...(justSaved
        ? { backgroundColor: "#16a34a", color: "white" }
        : isDirty && !isSaving
          ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)", hoverStyle: { opacity: 0.9 } }
          : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)", cursor: "not-allowed" })} className={`${className}`}
    >
      {isSaving ? (
        <>
          <Loader2 size={16} />
          Saving...
        </>
      ) : justSaved ? (
        <>
          <Check size={16} />
          Saved
        </>
      ) : (
        <>
          <Save size={16} />
          Save
          {isDirty && <SizableText marginLeft="$1" height="$2" width="$2" borderRadius="$10" backgroundColor="currentColor" />}
        </>
      )}
    </Button>
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
    <SizableText alignItems="center" gap="$2" fontSize="$1" color="$color11" display="flex" flexDirection="row" className={`${className}`}>
      {isDirty ? (
        <>
          <SizableText height="$2" width="$2" borderRadius="$10" backgroundColor="$yellow9" />
          Unsaved changes
        </>
      ) : lastSaved ? (
        <>
          <Check size={12} color="$green10" />
          Saved {getTimeAgo(lastSaved)}
        </>
      ) : (
        <>
          <Check size={12} color="$green10" />
          All changes saved
        </>
      )}
    </SizableText>
  );
}
