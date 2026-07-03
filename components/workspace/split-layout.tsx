'use client';

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
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
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
    <div
      ref={containerRef}
      className={`flex h-full w-full ${className}`}
    >
      {/* Left pane */}
      <div
        className="h-full overflow-hidden"
        style={{ width: `${split}%` }}
      >
        {left}
      </div>

      {/* Resizer */}
      <div
        className={`relative w-1 cursor-col-resize group hover:bg-primary/20 ${
          isDragging ? 'bg-primary/40' : 'bg-border'
        }`}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 group-hover:w-1.5 transition-all">
          <div className="h-full w-full bg-transparent group-hover:bg-primary/50 transition-colors" />
        </div>
      </div>

      {/* Right pane */}
      <div
        className="h-full overflow-hidden flex-1"
        style={{ width: `${100 - split}%` }}
      >
        {right}
      </div>
    </div>
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
    return <div className={`h-full w-full ${className}`}>{editor}</div>;
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
