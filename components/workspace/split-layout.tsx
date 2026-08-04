'use client';

import { XStack, YStack, type GuiElement } from '@hanzo/gui';
import React, { useState, useCallback, useRef, useEffect } from 'react';

interface SplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultSplit?: number; // Percentage (0-100)
  minSize?: number; // Minimum percentage
  maxSize?: number; // Maximum percentage
  onSplitChange?: (split: number) => void;
  className?: string;
}

export function SplitLayout({
  left,
  right,
  defaultSplit = 50,
  minSize = 20,
  maxSize = 80,
  onSplitChange,
  className = ''
}: SplitLayoutProps) {
  const [split, setSplit] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<GuiElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!isDragging || !container || !('getBoundingClientRect' in container)) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    const clampedPercentage = Math.max(minSize, Math.min(maxSize, percentage));
    setSplit(clampedPercentage);
    onSplitChange?.(clampedPercentage);
  }, [isDragging, minSize, maxSize, onSplitChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <XStack
      ref={containerRef}
      height="100%" width="100%" className={`${className}`}
    >
      {/* Left pane */}
      <YStack
        height="100%" overflow="hidden"
        style={{ width: `${split}%` }}
      >
        {left}
      </YStack>

      {/* Resizer */}
      <YStack
        position="relative" width="$1" cursor="col-resize" group hoverStyle={{ backgroundColor: "$color6" }} {...{ backgroundColor: isDragging ? "$color8" : "$borderColor" }}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator */}
        <YStack position="absolute" top="$0" bottom="$0" left="50%" x="50%" width="$1" $group-hover={{ width: "$1.5" }}>
          <YStack height="100%" width="100%" backgroundColor="transparent" $group-hover={{ backgroundColor: "$color6" }} />
        </YStack>
      </YStack>

      {/* Right pane */}
      <YStack
        height="100%" overflow="hidden" flex={1}
        style={{ width: `${100 - split}%` }}
      >
        {right}
      </YStack>
    </XStack>
  );
}

interface WorkspaceLayoutProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  showPreview?: boolean;
  defaultSplit?: number;
  className?: string;
}

export function WorkspaceLayout({
  editor,
  preview,
  showPreview = true,
  defaultSplit = 50,
  className = ''
}: WorkspaceLayoutProps) {
  if (!showPreview) {
    return <YStack height="100%" width="100%" className={`${className}`}>{editor}</YStack>;
  }

  return (
    <SplitLayout
      left={editor}
      right={preview}
      defaultSplit={defaultSplit}
      minSize={30}
      maxSize={70}
      className={className}
  />
  );
}
