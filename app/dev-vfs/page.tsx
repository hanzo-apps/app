'use client';

import { useEffect, useState } from 'react';
import { DevEnvironment } from '@/components/dev-environment';
import { vfs } from '@/lib/vfs';
import { Loader2 } from 'lucide-react';

/**
 * Development Environment Page with VFS-backed Monaco Editor and File Explorer
 *
 * This page demonstrates the integrated Monaco Editor and File Explorer components
 * that work with the Virtual File System (VFS).
 *
 * Features:
 * - Multi-tab Monaco Editor with syntax highlighting
 * - File tree explorer with drag-and-drop support
 * - Full file operations (create, rename, delete, move)
 * - Keyboard shortcuts (Cmd+S for save)
 * - Theme support (dark/light)
 * - Responsive layout with mobile support
 */
export default function DevVFSPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeProject = async () => {
      try {
        // Initialize VFS
        await vfs.init();

        // Create or get a demo project
        const demoProjectId = 'demo-project-' + Date.now();
        setProjectId(demoProjectId);

        // Create some demo files
        await vfs.createFile(demoProjectId, '/index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Project</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <h1>Welcome to Monaco Editor & File Explorer Demo</h1>
  <p>This is a demo project showcasing the integrated development environment.</p>
  <script src="/script.js"></script>
</body>
</html>`);

        await vfs.createFile(demoProjectId, '/styles.css', `body {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  line-height: 1.6;
}

h1 {
  color: #2563eb;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

p {
  color: #374151;
}`);

        await vfs.createFile(demoProjectId, '/script.js', `console.log('Demo project loaded!');

// Add interactivity
document.addEventListener('DOMContentLoaded', () => {
  const heading = document.querySelector('h1');
  if (heading) {
    heading.addEventListener('click', () => {
      heading.style.color = '#' + Math.floor(Math.random()*16777215).toString(16);
    });
  }
});`);

        await vfs.createFile(demoProjectId, '/README.md', `# Demo Project

This is a demonstration of the Monaco Editor and File Explorer integration.

## Features

- **Multi-tab editing**: Open multiple files simultaneously
- **Syntax highlighting**: Automatic language detection
- **File operations**: Create, rename, delete, and move files
- **Keyboard shortcuts**: Cmd/Ctrl+S to save
- **Drag and drop**: Upload files by dragging them into the explorer
- **Context menus**: Right-click for file operations

## Usage

1. Click on files in the explorer to open them
2. Edit the content in the Monaco Editor
3. Save with Cmd/Ctrl+S or the Save button
4. Create new files and folders using the toolbar or context menu
5. Drag files to rearrange them in the tree

Enjoy coding!`);

        // Create a nested directory structure
        await vfs.createDirectory(demoProjectId, '/components');
        await vfs.createFile(demoProjectId, '/components/Button.tsx', `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={\`btn btn-\${variant}\`}
    >
      {children}
    </button>
  );
}`);

        await vfs.createDirectory(demoProjectId, '/utils');
        await vfs.createFile(demoProjectId, '/utils/helpers.ts', `export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}`);

        setIsInitializing(false);
      } catch (error) {
        console.error('Failed to initialize project:', error);
        setIsInitializing(false);
      }
    };

    initializeProject();
  }, []);

  if (isInitializing || !projectId) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Initializing development environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <DevEnvironment projectId={projectId} />
    </div>
  );
}
