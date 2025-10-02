'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VirtualServer } from '@/lib/preview/virtual-server';
import {
  CompiledProject,
  PreviewMessage,
  PreviewHostMessage
} from '@/lib/preview/types';
import { vfs } from '@/lib/vfs';
import {
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Home,
  Eye,
  X
} from 'lucide-react';

interface LivePreviewProps {
  projectId: string;
  currentPath?: string;
  refreshTrigger?: number;
  onClose?: () => void;
}

type DeviceSize = 'mobile' | 'tablet' | 'desktop' | 'responsive';

const DEVICE_SIZES: Record<DeviceSize, { width?: string; height?: string; maxHeight?: string; maxWidth?: string }> = {
  mobile: { width: '375px', height: '100%', maxHeight: '667px' },
  tablet: { width: '768px', height: '100%', maxHeight: '1024px' },
  desktop: { width: '100%', height: '100%', maxHeight: '900px', maxWidth: '1440px' },
  responsive: { width: '100%', height: '100%' }
};

export function LivePreview({
  projectId,
  refreshTrigger,
  onClose
}: LivePreviewProps) {
  const [compiledProject, setCompiledProject] = useState<CompiledProject | null>(null);
  const [activePath, setActivePath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('tablet');
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['/']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [iframeReady, setIframeReady] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const serverRef = useRef<VirtualServer | null>(null);
  const compiledProjectRef = useRef<CompiledProject | null>(null);
  const activePathRef = useRef<string>('/');
  const pendingLoadPath = useRef<string | null>(null);

  const postMessageToIframe = useCallback((message: PreviewHostMessage) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      return;
    }
    try {
      iframeRef.current.contentWindow.postMessage(message, '*');
    } catch (err) {
      console.warn('Failed to communicate with preview iframe', err);
    }
  }, []);

  const compilingRef = useRef(false);
  const pendingCompileOptionsRef = useRef<{ preserve: boolean; showLoading: boolean } | null>(null);

  const Header = () => (
    <div className="p-3 border-b bg-muted/70 flex items-center gap-2">
      <Eye
        className="h-4 w-4 md:hidden"
        style={{ color: 'var(--primary)' }}
      />
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide preview"
          className="relative hidden h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-destructive md:flex group"
        >
          <Eye
            className="h-4 w-4 transition-opacity group-hover:opacity-0"
            style={{ color: 'var(--primary)' }}
          />
          <X className="absolute h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      ) : (
        <Eye
          className="hidden h-4 w-4 md:inline-flex"
          style={{ color: 'var(--primary)' }}
        />
      )}
      <h3 className="text-sm font-medium">Live Preview</h3>
    </div>
  );

  useEffect(() => {
    compiledProjectRef.current = compiledProject;
  }, [compiledProject]);

  useEffect(() => {
    activePathRef.current = activePath;
  }, [activePath]);

  useEffect(() => {
    if (iframeReady && pendingLoadPath.current && compiledProjectRef.current) {
      const pathToLoad = pendingLoadPath.current;
      pendingLoadPath.current = null;
      loadPage(pathToLoad, compiledProjectRef.current);
    }
  }, [iframeReady]);

  const compileAndLoadInternal = useCallback(async (preserveCurrentPath = false, showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      await vfs.init();

      const currentPath = preserveCurrentPath ? activePathRef.current : null;

      if (serverRef.current) {
        serverRef.current.cleanupBlobUrls();
      }

      const server = new VirtualServer(projectId);
      serverRef.current = server;

      const compiled = await server.compileProject();
      setCompiledProject(compiled);
      compiledProjectRef.current = compiled;

      let pathToLoad = currentPath;
      if (!pathToLoad) {
        pathToLoad = compiled.blobUrls.has('/index.html') ? '/' :
                     compiled.entryPoint ||
                     (compiled.routes.length > 0 ? compiled.routes[0].path : '/');
      }

      loadPage(pathToLoad, compiled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compile project');
      console.error('Compilation error:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [projectId]);

  const compileAndLoad = useCallback((preserveCurrentPath: boolean = false, showLoading: boolean = true) => {
    if (compilingRef.current) {
      const pending = pendingCompileOptionsRef.current;
      pendingCompileOptionsRef.current = {
        preserve: (pending?.preserve ?? false) || preserveCurrentPath,
        showLoading: (pending?.showLoading ?? false) || showLoading
      };
      return;
    }

    const run = async (preserve: boolean, loadingFlag: boolean) => {
      compilingRef.current = true;
      try {
        await compileAndLoadInternal(preserve, loadingFlag);
      } finally {
        compilingRef.current = false;
        const pending = pendingCompileOptionsRef.current;
        pendingCompileOptionsRef.current = null;
        if (pending) {
          compileAndLoad(pending.preserve, pending.showLoading);
        }
      }
    };

    void run(preserveCurrentPath, showLoading);
  }, [compileAndLoadInternal]);

  useEffect(() => {
    compileAndLoad();
  }, [projectId, refreshTrigger, compileAndLoad]);

  const loadPage = (path: string, compiled?: CompiledProject) => {
    const projectToUse = compiled || compiledProjectRef.current || compiledProject;

    if (!projectToUse) {
      console.warn('No compiled project available');
      return;
    }

    if (!iframeRef.current || !iframeReady) {
      pendingLoadPath.current = path;
      return;
    }

    let normalizedPath = path;
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }

    const route = projectToUse.routes.find(r => r.path === normalizedPath);
    let filePath: string;
    if (route) {
      filePath = route.file;
    } else if (normalizedPath === '/') {
      filePath = '/index.html';
    } else {
      filePath = normalizedPath + '.html';
    }

    const htmlFile = projectToUse.files.find(f => f.path === filePath);

    if (!htmlFile) {
      setError(`Page not found: ${path}`);
      const indexFile = projectToUse.files.find(f => f.path === '/index.html' || f.path === 'index.html');
      if (indexFile && path !== '/') {
        loadPage('/', compiled);
      }
      return;
    }

    let processedHtml = typeof htmlFile.content === 'string'
      ? htmlFile.content
      : new TextDecoder().decode(htmlFile.content as ArrayBuffer);

    // Replace CSS links with blob URLs
    processedHtml = processedHtml.replace(/href="([^"]+)"/g, (match, href) => {
      if (!href.endsWith('.css') || href.startsWith('http') || href.startsWith('//')) {
        return match;
      }

      const normalizedPath = href.startsWith('/') ? href : '/' + href;
      const blobUrl = projectToUse.blobUrls.get(normalizedPath);

      if (blobUrl) {
        return `href="${blobUrl}"`;
      }
      return match;
    });

    // Replace JavaScript sources
    processedHtml = processedHtml.replace(/src="([^"]+)"/g, (match, src) => {
      if (!src.endsWith('.js') || src.startsWith('http') || src.startsWith('//')) {
        return match;
      }

      const normalizedPath = src.startsWith('/') ? src : '/' + src;
      const blobUrl = projectToUse.blobUrls.get(normalizedPath);

      if (blobUrl) {
        return `src="${blobUrl}"`;
      }
      return match;
    });

    // Replace image sources
    processedHtml = processedHtml.replace(/src="([^"]+\.(png|jpg|jpeg|gif|svg|webp))"/gi, (match, imgPath) => {
      const normalizedImgPath = imgPath.startsWith('/') ? imgPath : '/' + imgPath;
      const blobUrl = projectToUse.blobUrls.get(normalizedImgPath);
      return blobUrl ? `src="${blobUrl}"` : match;
    });

    // Add navigation script for internal links
    const navigationScript = `
      <script>
        (function() {
          const isInIframe = window !== window.parent;

          function resolveInternalPath(href) {
            let path = href;
            if (!path.startsWith('/')) {
              const currentPath = '${normalizedPath}';
              const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
              path = currentDir + '/' + path;
            }

            if (path.endsWith('.html')) {
              path = path.slice(0, -5);
            }
            if (path === '/index') {
              path = '/';
            }
            return path;
          }

          document.addEventListener('click', function(e) {
            const target = e.target && e.target.closest ? e.target.closest('a') : null;
            if (target && target.getAttribute) {
              const href = target.getAttribute('href');

              if (!href) {
                return;
              }

              if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                  targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                return;
              }

              const isExternal = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//');
              if (!isExternal) {
                if (isInIframe) {
                  e.preventDefault();
                  window.parent.postMessage({
                    type: 'navigate',
                    path: resolveInternalPath(href)
                  }, '*');
                }
              } else {
                e.preventDefault();
                window.open(href, '_blank');
              }
            }
          });
        })();
      </script>
    `;

    if (processedHtml.includes('</body>')) {
      processedHtml = processedHtml.replace('</body>', navigationScript + '</body>');
    } else {
      processedHtml += navigationScript;
    }

    iframeRef.current.srcdoc = processedHtml;
    setActivePath(normalizedPath);
    activePathRef.current = normalizedPath;

    setHistoryIndex(currentIndex => {
      setNavigationHistory(currentHistory => {
        const newHistory = [...currentHistory.slice(0, currentIndex + 1), normalizedPath];
        return newHistory;
      });
      return currentIndex + 1;
    });
  };

  const handleNavigation = useCallback((path: string) => {
    loadPage(path);
  }, [compiledProject]);

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadPage(navigationHistory[newIndex]);
    }
  };

  const handleForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadPage(navigationHistory[newIndex]);
    }
  };

  const handleHome = () => {
    loadPage('/');
  };

  const handleRefresh = () => {
    compileAndLoad(true, false);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent<PreviewMessage>) => {
      const data = event.data;
      if (!data || typeof data !== 'object') {
        return;
      }

      if (data.type === 'navigate' && data.path) {
        handleNavigation(data.path);
        return;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleNavigation]);

  useEffect(() => {
    return () => {
      if (serverRef.current) {
        serverRef.current.cleanupBlobUrls();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Compiling project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-destructive space-y-2">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-2">{error}</p>
            <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Header />

      {/* Controls */}
      <div className="border-b p-2 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleBack}
            disabled={historyIndex === 0}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50"
            title="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex >= navigationHistory.length - 1}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50"
            title="Forward"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleHome}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted"
            title="Home"
          >
            <Home className="h-4 w-4" />
          </button>
          <button
            onClick={handleRefresh}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 px-3 py-1 bg-muted rounded text-sm">
          {activePath}
        </div>

        {/* Device size controls */}
        <div className="flex items-center gap-1 border-l pl-2">
          <button
            onClick={() => setDeviceSize('mobile')}
            className={`h-8 w-8 flex items-center justify-center rounded ${deviceSize === 'mobile' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            title="Mobile view"
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeviceSize('tablet')}
            className={`h-8 w-8 flex items-center justify-center rounded ${deviceSize === 'tablet' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            title="Tablet view"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeviceSize('desktop')}
            className={`h-8 w-8 flex items-center justify-center rounded ${deviceSize === 'desktop' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            title="Desktop view"
          >
            <Monitor className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 bg-muted/20 dark:bg-muted/10 p-4 overflow-auto min-h-0">
        <div
          className="bg-white mx-auto shadow-2xl rounded-lg transition-all duration-300"
          style={{
            width: DEVICE_SIZES[deviceSize].width || '100%',
            height: DEVICE_SIZES[deviceSize].height || '100%',
            maxHeight: DEVICE_SIZES[deviceSize].maxHeight || '100%',
            maxWidth: DEVICE_SIZES[deviceSize].maxWidth || '100%'
          }}
        >
          <iframe
            ref={(el) => {
              iframeRef.current = el;
              if (el && !iframeReady) {
                setTimeout(() => {
                  setIframeReady(true);
                }, 0);
              } else if (!el && iframeReady) {
                setIframeReady(false);
              }
            }}
            className="w-full h-full rounded-lg"
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="Preview"
          />
        </div>
      </div>
    </div>
  );
}
