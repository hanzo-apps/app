# Checkpoint & Preview System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Basic Usage - Complete Workspace

The easiest way to get started is using the complete workspace component:

```typescript
// app/editor/page.tsx
'use client';

import { DevWorkspace } from '@/components/workspace/dev-workspace';

export default function EditorPage() {
  const projectId = 'project_123'; // Your project ID

  return <DevWorkspace projectId={projectId} />;
}
```

That's it! You now have:
- ✅ Live preview with hot reload
- ✅ Checkpoint/rollback system
- ✅ Save button with dirty tracking
- ✅ Auto-save indicator
- ✅ Resizable panels
- ✅ Checkpoint history

### 2. Custom Integration

For custom layouts, use individual components:

```typescript
'use client';

import { useState } from 'react';
import { WorkspaceLayout } from '@/components/workspace/split-layout';
import { LivePreview } from '@/components/preview/live-preview';
import { SaveButton, AutoSaveIndicator } from '@/components/ui/save-button';
import { CheckpointList } from '@/components/ui/rollback-button';

export default function MyEditor() {
  const projectId = 'project_123';
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="border-b p-2 flex items-center justify-between">
        <AutoSaveIndicator projectId={projectId} />
        <SaveButton projectId={projectId} />
      </div>

      {/* Editor + Preview */}
      <WorkspaceLayout
        editor={
          <div>Your editor here</div>
        }
        preview={
          <LivePreview
            projectId={projectId}
            refreshTrigger={refreshTrigger}
          />
        }
      />
    </div>
  );
}
```

### 3. Add Checkpoints After AI Operations

```typescript
import { checkpointManager } from '@/lib/vfs/checkpoint';
import { saveManager } from '@/lib/vfs/save-manager';

async function handleAIEdit(projectId: string, prompt: string) {
  // 1. Perform AI operation
  await performAIOperation(prompt);

  // 2. Create checkpoint
  await checkpointManager.createCheckpoint(
    projectId,
    `After: ${prompt}`,
    { kind: 'auto' }
  );

  // 3. Mark dirty
  saveManager.markDirty(projectId);

  // 4. Refresh preview
  setRefreshTrigger(prev => prev + 1);
}
```

### 4. Working with Files

```typescript
import { vfs } from '@/lib/vfs';

// Create a project
const project = await vfs.createProject('My App', 'Description');

// Create files
await vfs.createFile(project.id, '/index.html', `
  <!DOCTYPE html>
  <html>
    <head>
      <title>My App</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <h1>Hello World</h1>
      <script src="/app.js"></script>
    </body>
  </html>
`);

await vfs.createFile(project.id, '/style.css', `
  body {
    margin: 0;
    font-family: system-ui;
  }
`);

await vfs.createFile(project.id, '/app.js', `
  console.log('App loaded');
`);

// Read a file
const file = await vfs.readFile(project.id, '/index.html');
console.log(file.content);

// Update a file
await vfs.updateFile(project.id, '/index.html', newContent);

// List all files
const files = await vfs.listDirectory(project.id, '/');
```

### 5. Manual Save & Restore

```typescript
import { saveManager } from '@/lib/vfs/save-manager';

// Save current state
await saveManager.save(projectId, 'Manual save before refactor');

// ... make changes ...

// Restore to last saved
const restored = await saveManager.restoreLastSaved(projectId);
if (restored) {
  console.log('Restored successfully');
}
```

### 6. Show Checkpoint History

```typescript
import { CheckpointList } from '@/components/ui/rollback-button';

<CheckpointList
  projectId={projectId}
  onRestore={(checkpointId, success) => {
    if (success) {
      console.log('Restored checkpoint:', checkpointId);
      setRefreshTrigger(prev => prev + 1); // Refresh preview
    }
  }}
/>
```

## 📦 What's Included

### Core Systems
- **VFS**: Virtual File System with IndexedDB storage
- **Checkpoints**: State snapshots with rollback
- **Save Manager**: Dirty tracking and manual saves
- **Preview**: Real-time compilation and preview

### UI Components
- `DevWorkspace`: Complete workspace (batteries included)
- `WorkspaceLayout`: Resizable split layout
- `LivePreview`: Live preview with controls
- `SaveButton`: Save button with dirty indicator
- `AutoSaveIndicator`: Save status display
- `RollbackButton`: Single checkpoint restore
- `CheckpointList`: Full checkpoint history

## 🎯 Common Patterns

### Pattern 1: AI Operation with Auto-Checkpoint

```typescript
const handleAI = async (operation: string) => {
  await performAI(operation);
  await checkpointManager.createCheckpoint(projectId, `After ${operation}`, { kind: 'auto' });
  saveManager.markDirty(projectId);
  setRefreshTrigger(prev => prev + 1);
};
```

### Pattern 2: User Edit with Dirty Tracking

```typescript
const handleEdit = async (path: string, content: string) => {
  await vfs.updateFile(projectId, path, content);
  saveManager.markDirty(projectId);
  setRefreshTrigger(prev => prev + 1);
};
```

### Pattern 3: Programmatic Change (No Dirty)

```typescript
await saveManager.runWithSuppressedDirty(projectId, async () => {
  await vfs.updateFile(projectId, '/config.json', newConfig);
});
```

## 🔧 Configuration

### Customize Checkpoint Cleanup

Edit `lib/vfs/checkpoint.ts`:

```typescript
// Change from 10 to your preferred limit
if (autoCheckpoints.length > 10) {
  // ...
}
```

### Customize Device Sizes

Edit `components/preview/live-preview.tsx`:

```typescript
const DEVICE_SIZES = {
  mobile: { width: '375px', maxHeight: '667px' },
  tablet: { width: '768px', maxHeight: '1024px' },
  desktop: { width: '100%', maxHeight: '900px', maxWidth: '1440px' },
  // Add your custom sizes
  wide: { width: '100%', maxHeight: '100%', maxWidth: '1920px' },
};
```

### Change Database Name

Edit `lib/vfs/index.ts` and `lib/vfs/checkpoint.ts`:

```typescript
private dbName = 'YourAppName';
```

## 🐛 Troubleshooting

### Preview not updating?
```typescript
// Manually trigger refresh
setRefreshTrigger(prev => prev + 1);
```

### Checkpoint not found?
```typescript
const exists = await checkpointManager.checkpointExists(checkpointId);
if (!exists) {
  console.error('Checkpoint not found');
}
```

### Dirty state stuck?
```typescript
// Reset dirty state
saveManager.markClean(projectId);
```

## 📚 Next Steps

- Read [CHECKPOINT_PREVIEW_SYSTEM.md](./CHECKPOINT_PREVIEW_SYSTEM.md) for comprehensive docs
- Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details
- Check `lib/vfs/__tests__/checkpoint.test.ts` for test examples

## 🎉 You're Ready!

Start building with:
```bash
npm run dev
```

Visit your editor page and you'll have a fully functional workspace with:
- ✅ Live preview
- ✅ Checkpoints
- ✅ Auto-save
- ✅ Version control

Happy coding! 🚀
