# Virtual File System (VFS)

Complete Virtual File System implementation for Hanzo Build with IndexedDB storage, shell command support, and agentic file operations.

## Features

- **Complete File Operations**: create, read, update, delete, rename, move files
- **Directory Management**: create, delete, rename directories with tree structure
- **Shell Commands**: ls, cat, grep, find, mkdir, rm, rmdir, mv, cp
- **Project Management**: create, duplicate, export, import projects
- **File Tree Support**: hierarchical file structure with parent/child relationships
- **Type-Safe**: Full TypeScript support with complete type definitions
- **IndexedDB Storage**: Persistent browser-based storage
- **File Type Detection**: Automatic MIME type detection for 30+ file extensions

## Installation

Already included in Hanzo Build. Import from `@/lib/vfs`:

```typescript
import { vfs, VirtualFileSystem } from '@/lib/vfs';
import { vfsShell } from '@/lib/vfs/cli-shell';
```

## Quick Start

### Basic File Operations

```typescript
import { vfs } from '@/lib/vfs';

// Initialize VFS
await vfs.init();

// Create a project
const project = await vfs.createProject('My Project', 'Description');

// Create a file
await vfs.createFile(project.id, '/index.html', '<h1>Hello World</h1>');

// Read a file
const file = await vfs.readFile(project.id, '/index.html');
console.log(file.content); // '<h1>Hello World</h1>'

// Update a file
await vfs.updateFile(project.id, '/index.html', '<h1>Hello Hanzo</h1>');

// Delete a file
await vfs.deleteFile(project.id, '/index.html');
```

### Directory Operations

```typescript
// Create directory
await vfs.createDirectory(project.id, '/src');
await vfs.createDirectory(project.id, '/src/components');

// List directory contents
const files = await vfs.listDirectory(project.id, '/src');

// Get all files and directories
const allEntries = await vfs.getAllFilesAndDirectories(project.id);

// Delete directory (recursive)
await vfs.deleteDirectory(project.id, '/src');
```

### Shell Commands

```typescript
import { vfsShell } from '@/lib/vfs/cli-shell';

// List files
const lsResult = await vfsShell.execute(project.id, ['ls', '/']);
console.log(lsResult.stdout); // '/index.html\n/src'

// Read file content
const catResult = await vfsShell.execute(project.id, ['cat', '/index.html']);
console.log(catResult.stdout); // file content

// Search with grep
const grepResult = await vfsShell.execute(project.id, ['grep', 'Hello', '/index.html']);
console.log(grepResult.stdout); // lines containing 'Hello'

// Create directory
await vfsShell.execute(project.id, ['mkdir', '-p', '/src/components']);

// Remove file
await vfsShell.execute(project.id, ['rm', '/old-file.txt']);

// Remove directory recursively
await vfsShell.execute(project.id, ['rm', '-rf', '/old-dir']);

// Move/rename file
await vfsShell.execute(project.id, ['mv', '/old.txt', '/new.txt']);

// Copy file
await vfsShell.execute(project.id, ['cp', '/source.txt', '/dest.txt']);
```

### Supported Shell Commands

| Command | Description | Example |
|---------|-------------|---------|
| `ls` | List directory contents | `ls /`, `ls -R /` |
| `cat` | Display file content | `cat /index.html` |
| `grep` | Search for patterns | `grep 'pattern' /file.txt`, `grep -F 'literal' /file.txt` |
| `find` | Find files by pattern | `find / -name '*.js'` |
| `mkdir` | Create directory | `mkdir /new-dir`, `mkdir -p /path/to/dir` |
| `rm` | Remove files/directories | `rm /file.txt`, `rm -rf /dir` |
| `mv` | Move/rename | `mv /old.txt /new.txt` |
| `cp` | Copy files | `cp /src.txt /dest.txt`, `cp -r /dir /new-dir` |

### Project Management

```typescript
// List all projects
const projects = await vfs.listProjects();

// Get project info
const project = await vfs.getProject(projectId);

// Update project
project.name = 'New Name';
await vfs.updateProject(project);

// Duplicate project
const copy = await vfs.duplicateProject(projectId);

// Export as ZIP
const zipBlob = await vfs.exportProjectAsZip(projectId);
// Download the blob or save it

// Import from ZIP
const file = new File([zipBlob], 'project.zip');
const imported = await vfs.importProjectFromZip(file, 'Imported Project');

// Delete project
await vfs.deleteProject(projectId);
```

## API Reference

### VirtualFileSystem

#### File Operations

- `createFile(projectId: string, path: string, content: string | ArrayBuffer): Promise<VirtualFile>`
- `readFile(projectId: string, path: string): Promise<VirtualFile>`
- `updateFile(projectId: string, path: string, content: string | ArrayBuffer): Promise<VirtualFile>`
- `deleteFile(projectId: string, path: string): Promise<void>`
- `renameFile(projectId: string, oldPath: string, newPath: string): Promise<VirtualFile>`
- `moveFile(projectId: string, oldPath: string, newPath: string): Promise<VirtualFile>`
- `fileExists(projectId: string, path: string): Promise<boolean>`
- `patchFile(projectId: string, path: string, patches: PatchOperation[]): Promise<VirtualFile>`

#### Directory Operations

- `createDirectory(projectId: string, path: string): Promise<void>`
- `listDirectory(projectId: string, path: string): Promise<VirtualFile[]>`
- `deleteDirectory(projectId: string, path: string): Promise<void>`
- `renameDirectory(projectId: string, oldPath: string, newPath: string): Promise<void>`
- `getAllFilesAndDirectories(projectId: string): Promise<Array<VirtualFile | DirectoryEntry>>`
- `getFileTree(projectId: string): Promise<FileTreeNode | null>`

#### Project Operations

- `createProject(name: string, description?: string): Promise<Project>`
- `getProject(id: string): Promise<Project>`
- `updateProject(project: Project): Promise<void>`
- `deleteProject(id: string): Promise<void>`
- `listProjects(): Promise<Project[]>`
- `duplicateProject(projectId: string): Promise<Project>`
- `exportProjectAsZip(projectId: string): Promise<Blob>`
- `importProject(data: { project: Project; files: VirtualFile[] }): Promise<Project>`
- `importProjectFromZip(zipFile: File, projectName?: string): Promise<Project>`

### Types

```typescript
interface VirtualFile {
  id: string;
  projectId: string;
  path: string;
  name: string;
  type: 'html' | 'css' | 'js' | 'json' | 'text' | 'template' | 'image' | 'video' | 'binary';
  content: string | ArrayBuffer;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    isEntry?: boolean;
    dependencies?: string[];
  };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    defaultTemplate?: string;
    globalStyles?: string;
  };
  lastSavedCheckpointId?: string | null;
  lastSavedAt?: Date | null;
  costTracking?: {
    totalCost: number;
    providerBreakdown: Record<string, any>;
    sessionHistory?: Array<any>;
  };
}

interface FileTreeNode {
  id: string;
  projectId: string;
  path: string;
  type: 'directory' | 'file';
  parentPath: string | null;
  children?: string[];
}

interface PatchOperation {
  search: string;
  replace: string;
}
```

## Advanced Usage

### File Type Detection

The VFS automatically detects file types based on extensions:

```typescript
import { getFileTypeFromPath, getSpecificMimeType } from '@/lib/vfs/types';

const type = getFileTypeFromPath('/app.tsx'); // 'js'
const mimeType = getSpecificMimeType('/app.tsx'); // 'application/typescript'
```

Supported file types:
- **HTML**: .html, .htm
- **CSS**: .css
- **JavaScript**: .js, .mjs, .jsx, .ts, .tsx
- **JSON**: .json
- **Text**: .txt, .md, .xml, .svg
- **Templates**: .hbs, .handlebars
- **Images**: .png, .jpg, .jpeg, .gif, .webp, .ico, .bmp
- **Videos**: .mp4, .webm, .ogg

### File Size Limits

Default file size limits per type:

```typescript
{
  text: 5MB,
  html: 5MB,
  css: 5MB,
  js: 5MB,
  json: 5MB,
  template: 5MB,
  image: 10MB,
  video: 50MB,
  binary: 10MB
}
```

### Path Normalization

Paths are automatically normalized:
- Remove trailing newlines/escape sequences
- Ensure leading `/`
- Clean up redundant slashes

### Events

The VFS dispatches browser events for file changes:

```typescript
window.addEventListener('filesChanged', () => {
  console.log('File structure changed');
});

window.addEventListener('fileContentChanged', (e: CustomEvent) => {
  console.log('File content changed:', e.detail.path);
});
```

## Integration with Hanzo Build

The VFS is designed to work seamlessly with Hanzo Build's agent system:

```typescript
import { vfs } from '@/lib/vfs';
import { vfsShell } from '@/lib/vfs/cli-shell';

// Agent can execute shell commands
const agentShellExecution = async (projectId: string, command: string[]) => {
  const result = await vfsShell.execute(projectId, command);
  return {
    success: result.success,
    output: result.stdout || result.stderr
  };
};

// Agent can manipulate files directly
const agentFileOperation = async (projectId: string, operation: string) => {
  await vfs.init();

  switch (operation) {
    case 'create':
      return await vfs.createFile(projectId, '/newfile.ts', '// Generated code');
    case 'read':
      return await vfs.readFile(projectId, '/config.json');
    case 'update':
      return await vfs.updateFile(projectId, '/index.html', '<h1>Updated</h1>');
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
};
```

## Error Handling

All VFS methods throw descriptive errors:

```typescript
try {
  await vfs.readFile(projectId, '/nonexistent.txt');
} catch (error) {
  console.error(error.message); // "File not found: /nonexistent.txt"
}

try {
  await vfs.createFile(projectId, '/existing.txt', 'content');
} catch (error) {
  console.error(error.message); // "File already exists: /existing.txt"
}
```

## Performance Considerations

- **IndexedDB**: All operations are asynchronous and non-blocking
- **Batching**: Use `Promise.all()` for multiple independent operations
- **Caching**: File content is cached in memory during read operations
- **Tree Updates**: File tree is automatically maintained for efficient directory operations

## Browser Compatibility

Requires IndexedDB support (available in all modern browsers):
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

## License

Part of Hanzo AI platform. See main project license for details.
