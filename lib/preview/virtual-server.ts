import { vfs, VirtualFile } from '../vfs';
import { ProcessedFile, Route, CompiledProject } from './types';

export class VirtualServer {
  private projectId: string;
  private blobUrls: Map<string, string> = new Map();
  private fileHashes: Map<string, string> = new Map();

  constructor(projectId: string, existingBlobUrls?: Map<string, string>) {
    this.projectId = projectId;
    if (existingBlobUrls) {
      this.blobUrls = new Map(existingBlobUrls);
    }
  }

  private hashContent(content: string | ArrayBuffer): string {
    const str = typeof content === 'string' ? content : new TextDecoder().decode(content);
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private getMimeType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'ico': 'image/x-icon',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf',
      'eot': 'font/eot',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  async compileProject(incrementalUpdate = false): Promise<CompiledProject> {
    await vfs.init();
    const files = await vfs.listDirectory(this.projectId, '/');

    const oldBlobUrls = new Map(this.blobUrls);
    const newBlobUrls = new Map<string, string>();
    const processedFiles: ProcessedFile[] = [];
    const routes: Route[] = [];

    for (const file of files) {
      const mimeType = this.getMimeType(file.path);
      const processedFile: ProcessedFile = {
        path: file.path,
        content: file.content,
        mimeType,
      };

      const contentHash = this.hashContent(processedFile.content);
      const previousHash = this.fileHashes.get(processedFile.path);

      // Reuse existing blob URL if content hasn't changed
      if (incrementalUpdate && previousHash === contentHash && oldBlobUrls.has(processedFile.path)) {
        const existingUrl = oldBlobUrls.get(processedFile.path)!;
        newBlobUrls.set(processedFile.path, existingUrl);
        processedFile.blobUrl = existingUrl;
        oldBlobUrls.delete(processedFile.path);
      } else {
        const blob = new Blob([processedFile.content], { type: processedFile.mimeType });
        const blobUrl = URL.createObjectURL(blob);
        newBlobUrls.set(processedFile.path, blobUrl);
        processedFile.blobUrl = blobUrl;
        this.fileHashes.set(processedFile.path, contentHash);
      }

      processedFiles.push(processedFile);

      // Detect HTML files and create routes
      if (mimeType === 'text/html') {
        const routePath = file.path === '/index.html' ? '/' : file.path.replace(/\.html$/, '');
        routes.push({
          path: routePath,
          file: file.path,
          title: this.extractTitle(file.content),
        });
      }
    }

    // Clean up old blob URLs that are no longer used
    for (const [path, url] of oldBlobUrls) {
      URL.revokeObjectURL(url);
      this.fileHashes.delete(path);
    }

    // Update internal blob URLs map
    this.blobUrls = newBlobUrls;

    // Determine entry point
    const entryPoint = routes.find(r => r.path === '/')?.file || '/index.html';

    return {
      entryPoint,
      files: processedFiles,
      routes,
      blobUrls: newBlobUrls,
    };
  }

  private extractTitle(content: string | ArrayBuffer): string | undefined {
    const html = typeof content === 'string' ? content : new TextDecoder().decode(content);
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : undefined;
  }

  cleanupBlobUrls(): void {
    for (const url of this.blobUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.blobUrls.clear();
    this.fileHashes.clear();
  }
}
