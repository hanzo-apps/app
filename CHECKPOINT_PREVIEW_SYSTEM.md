# Checkpoint & Preview System Documentation

## Overview

This document describes the checkpoint/rollback system and live preview implementation for Hanzo Build. The system provides:

1. **Checkpoint System**: State snapshots with rollback functionality
2. **Save Management**: Dirty state tracking and manual saves
3. **Live Preview**: Real-time preview with hot reload
4. **Split Layout**: Resizable workspace panels

## Architecture

### Core Components

```
lib/
├── vfs/
│   ├── index.ts           # Virtual File System (VFS)
│   ├── checkpoint.ts      # Checkpoint management
│   └── save-manager.ts    # Save state management
└── preview/
    ├── types.ts           # Preview type definitions
    └── virtual-server.ts  # Preview compilation

components/
├── preview/
│   └── live-preview.tsx   # Live preview with iframe
├── ui/
│   ├── rollback-button.tsx # Checkpoint rollback UI
│   └── save-button.tsx     # Save/auto-save UI
└── workspace/
    ├── split-layout.tsx    # Resizable split pane
    └── dev-workspace.tsx   # Complete workspace example
```

## Virtual File System (VFS)

### Features

- IndexedDB-based file storage
- Project management
- Full CRUD operations for files and directories
- Support for text and binary content

### Usage

```typescript
import { vfs } from '@/lib/vfs';

// Initialize VFS
await vfs.init();

// Create a project
const project = await vfs.createProject('My Project', 'Description');

// Create files
await vfs.createFile(project.id, '/index.html', '<html>...</html>');
await vfs.createFile(project.id, '/style.css', 'body { margin: 0; }');

// Read files
const file = await vfs.readFile(project.id, '/index.html');

// Update files
await vfs.updateFile(project.id, '/index.html', '<html>Updated</html>');

// List directory
const files = await vfs.listDirectory(project.id, '/');
```

## Checkpoint System

### Features

- Three checkpoint types: `auto`, `manual`, `system`
- Automatic cleanup (keeps last 10 auto checkpoints)
- Binary and text file support (base64 encoding)
- IndexedDB persistence
- Directory structure preservation

### Usage

```typescript
import { checkpointManager } from '@/lib/vfs/checkpoint';

// Create checkpoint
const checkpoint = await checkpointManager.createCheckpoint(
  projectId,
  'Description',
  { kind: 'auto' }
);

// Restore checkpoint
const success = await checkpointManager.restoreCheckpoint(checkpoint.id);

// Get all checkpoints
const checkpoints = await checkpointManager.getCheckpoints(projectId);

// Check if checkpoint exists
const exists = await checkpointManager.checkpointExists(checkpoint.id);
```

### Auto-Checkpoint Pattern

Create checkpoints after AI operations:

```typescript
async function handleAIOperation(projectId: string, operation: string) {
  // Perform AI operation
  await performAIOperation(operation);

  // Create checkpoint
  await checkpointManager.createCheckpoint(
    projectId,
    `After ${operation}`,
    { kind: 'auto' }
  );

  // Mark project as dirty
  saveManager.markDirty(projectId);
}
```

## Save Management

### Features

- Dirty state tracking
- Event-based state notifications
- Suppression for programmatic changes
- Manual and auto-save support

### Usage

```typescript
import { saveManager } from '@/lib/vfs/save-manager';

// Subscribe to dirty state changes
const unsubscribe = saveManager.subscribe((event) => {
  console.log(`Project ${event.projectId} dirty: ${event.dirty}`);
});

// Check dirty state
const isDirty = saveManager.isDirty(projectId);

// Mark dirty
saveManager.markDirty(projectId);

// Mark clean
saveManager.markClean(projectId);

// Save project
const checkpoint = await saveManager.save(projectId, 'Manual save');

// Restore last saved
const restored = await saveManager.restoreLastSaved(projectId);

// Suppress dirty tracking during programmatic changes
await saveManager.runWithSuppressedDirty(projectId, async () => {
  await vfs.updateFile(projectId, '/file.txt', 'content');
});
```

## Live Preview

### Features

- Real-time compilation
- Blob URL management
- Device size presets (mobile, tablet, desktop, responsive)
- Navigation controls (back, forward, home, refresh)
- Error handling
- Hot reload on file changes

### Usage

```typescript
import { LivePreview } from '@/components/preview/live-preview';

<LivePreview
  projectId={projectId}
  refreshTrigger={refreshTrigger}
  onClose={() => setShowPreview(false)}
/>
```

### Preview Compilation

```typescript
import { VirtualServer } from '@/lib/preview/virtual-server';

const server = new VirtualServer(projectId);
const compiled = await server.compileProject();

// Access compiled files
compiled.files.forEach(file => {
  console.log(file.path, file.blobUrl);
});

// Access routes
compiled.routes.forEach(route => {
  console.log(route.path, route.file);
});

// Cleanup when done
server.cleanupBlobUrls();
```

## UI Components

### RollbackButton

Single checkpoint rollback button:

```typescript
import { RollbackButton } from '@/components/ui/rollback-button';

<RollbackButton
  checkpointId={checkpoint.id}
  description={checkpoint.description}
  onRestore={(success) => console.log('Restored:', success)}
/>
```

### CheckpointList

Complete checkpoint history with rollback:

```typescript
import { CheckpointList } from '@/components/ui/rollback-button';

<CheckpointList
  projectId={projectId}
  onRestore={(checkpointId, success) => {
    console.log('Restored:', checkpointId, success);
  }}
/>
```

### SaveButton

Manual save button with dirty state indication:

```typescript
import { SaveButton } from '@/components/ui/save-button';

<SaveButton
  projectId={projectId}
  onSave={(success) => console.log('Saved:', success)}
/>
```

### AutoSaveIndicator

Visual indicator of save status:

```typescript
import { AutoSaveIndicator } from '@/components/ui/save-button';

<AutoSaveIndicator projectId={projectId} />
```

## Workspace Layout

### SplitLayout

Generic resizable split pane:

```typescript
import { SplitLayout } from '@/components/workspace/split-layout';

<SplitLayout
  left={<EditorComponent />}
  right={<PreviewComponent />}
  defaultSplit={50}
  minSize={30}
  maxSize={70}
  onSplitChange={(split) => console.log('Split:', split)}
/>
```

### WorkspaceLayout

Specialized layout for editor + preview:

```typescript
import { WorkspaceLayout } from '@/components/workspace/split-layout';

<WorkspaceLayout
  editor={<EditorComponent />}
  preview={<LivePreview projectId={projectId} />}
  showPreview={showPreview}
  defaultSplit={50}
/>
```

### DevWorkspace

Complete workspace example:

```typescript
import { DevWorkspace } from '@/components/workspace/dev-workspace';

<DevWorkspace projectId={projectId} />
```

## Events

### Custom Events

The system dispatches custom events for cross-component communication:

```typescript
// Checkpoint restored
window.addEventListener('checkpointRestored', (event: CustomEvent) => {
  console.log('Checkpoint restored:', event.detail.checkpointId);
});

// File changed
window.addEventListener('filesChanged', () => {
  console.log('Files changed');
});

// File content changed
window.addEventListener('fileContentChanged', (event: CustomEvent) => {
  console.log('File content changed:', event.detail.projectId);
});
```

## Best Practices

### 1. Checkpoint Strategy

- **Auto checkpoints**: After every AI operation
- **Manual checkpoints**: User-initiated saves
- **System checkpoints**: Before destructive operations

### 2. Save Management

```typescript
// Always wrap programmatic file changes
await saveManager.runWithSuppressedDirty(projectId, async () => {
  await vfs.updateFile(projectId, '/file.txt', 'content');
});

// Mark dirty after user edits
function handleUserEdit() {
  saveManager.markDirty(projectId);
}
```

### 3. Preview Updates

```typescript
// Use refresh trigger for manual updates
const [refreshTrigger, setRefreshTrigger] = useState(0);

function handleFileChange() {
  setRefreshTrigger(prev => prev + 1);
}

<LivePreview projectId={projectId} refreshTrigger={refreshTrigger} />
```

### 4. Cleanup

```typescript
useEffect(() => {
  return () => {
    // Cleanup blob URLs when component unmounts
    serverRef.current?.cleanupBlobUrls();
  };
}, []);
```

## Integration Example

Complete example integrating all features:

```typescript
'use client';

import React, { useState, useCallback } from 'react';
import { WorkspaceLayout } from '@/components/workspace/split-layout';
import { LivePreview } from '@/components/preview/live-preview';
import { CheckpointList } from '@/components/ui/rollback-button';
import { SaveButton, AutoSaveIndicator } from '@/components/ui/save-button';
import { checkpointManager } from '@/lib/vfs/checkpoint';
import { saveManager } from '@/lib/vfs/save-manager';
import { vfs } from '@/lib/vfs';

export function MyEditor({ projectId }: { projectId: string }) {
  const [showPreview, setShowPreview] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // AI operation with checkpoint
  const handleAIOperation = useCallback(async (operation: string) => {
    // Perform AI operation
    await performAIOperation(operation);

    // Create checkpoint
    await checkpointManager.createCheckpoint(
      projectId,
      `After ${operation}`,
      { kind: 'auto' }
    );

    // Mark dirty and refresh preview
    saveManager.markDirty(projectId);
    setRefreshTrigger(prev => prev + 1);
  }, [projectId]);

  // File edit with dirty tracking
  const handleFileEdit = useCallback(async (path: string, content: string) => {
    await vfs.updateFile(projectId, path, content);
    saveManager.markDirty(projectId);
    setRefreshTrigger(prev => prev + 1);
  }, [projectId]);

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-2 flex items-center justify-between">
        <AutoSaveIndicator projectId={projectId} />
        <SaveButton projectId={projectId} />
      </div>

      <div className="flex-1 min-h-0">
        <WorkspaceLayout
          showPreview={showPreview}
          editor={
            <YourEditorComponent
              projectId={projectId}
              onEdit={handleFileEdit}
              onAIOperation={handleAIOperation}
            />
          }
          preview={
            <LivePreview
              projectId={projectId}
              refreshTrigger={refreshTrigger}
            />
          }
        />
      </div>
    </div>
  );
}
```

## Testing

### Testing Checkpoints

```typescript
import { checkpointManager } from '@/lib/vfs/checkpoint';
import { vfs } from '@/lib/vfs';

// Test checkpoint creation and restore
const project = await vfs.createProject('Test Project');
await vfs.createFile(project.id, '/test.txt', 'original');

const checkpoint = await checkpointManager.createCheckpoint(
  project.id,
  'Test checkpoint'
);

await vfs.updateFile(project.id, '/test.txt', 'modified');

const restored = await checkpointManager.restoreCheckpoint(checkpoint.id);
const file = await vfs.readFile(project.id, '/test.txt');

console.assert(file.content === 'original', 'Checkpoint restore failed');
```

### Testing Save Manager

```typescript
import { saveManager } from '@/lib/vfs/save-manager';

let dirtyState = false;
const unsubscribe = saveManager.subscribe((event) => {
  dirtyState = event.dirty;
});

saveManager.markDirty(projectId);
console.assert(dirtyState === true, 'Dirty state not set');

saveManager.markClean(projectId);
console.assert(dirtyState === false, 'Clean state not set');

unsubscribe();
```

## Performance Considerations

1. **IndexedDB**: All file operations are asynchronous and non-blocking
2. **Blob URLs**: Reused when file content hasn't changed
3. **Incremental compilation**: Virtual server supports incremental updates
4. **Checkpoint cleanup**: Automatically limits auto checkpoints to 10 most recent

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14.5+)
- Requires: IndexedDB, Blob API, postMessage

## Troubleshooting

### Checkpoint not restoring

Check checkpoint ID format and existence:

```typescript
const exists = await checkpointManager.checkpointExists(checkpointId);
if (!exists) {
  await checkpointManager.loadCheckpointsFromDB();
}
```

### Preview not updating

Manually trigger refresh:

```typescript
setRefreshTrigger(prev => prev + 1);
```

### Dirty state not updating

Check subscription and suppression:

```typescript
const isDirty = saveManager.isDirty(projectId);
const isSuppressed = saveManager.isSuppressed(projectId); // Note: private method
```

## Future Enhancements

1. **Compression**: Compress checkpoint data for older checkpoints
2. **Cloud sync**: Sync checkpoints to cloud storage
3. **Diff view**: Show changes between checkpoints
4. **Branching**: Create checkpoint branches for experimentation
5. **Export/Import**: Export and import checkpoint data
