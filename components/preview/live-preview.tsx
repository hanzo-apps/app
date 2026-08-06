'use client';

import { Button } from '@hanzo/ui';
import { XStack, H3, YStack, SizableText, Paragraph } from '@hanzo/ui';
import { useState, useEffect, useRef, useCallback } from 'react';
import { VirtualServer } from '@/lib/preview/virtual-server';
import { resolveAssets } from '@/lib/preview/rewrite';
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
    <XStack padding="$3" borderBottomWidth={1} backgroundColor="$color3" alignItems="center" gap="$2">
      <Eye
        size={16}
        style={{ color: 'var(--primary)' }}
  />
      {onClose ? (
        <Button
          type="button"
          onClick={onClose}
          aria-label="Hide preview"
          position="relative" display="none" $md={{ display: "flex" }} height="$5" width="$5" alignItems="center" justifyContent="center" borderRadius="$1" group
        >
          <Eye
            size={16}
            style={{ color: 'var(--primary)' }}
  />
          <X size={12} />
        </Button>
      ) : (
        <Eye
          size={16}
          style={{ color: 'var(--primary)' }}
  />
      )}
      <H3 fontSize="$3" fontWeight="500">Live Preview</H3>
    </XStack>
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

      const server = new VirtualServer(vfs, projectId);
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

    processedHtml = resolveAssets(processedHtml, projectToUse.blobUrls);

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
      // Only OUR frame. `event.origin` cannot carry this: the preview is
      // sandboxed without `allow-same-origin`, so its origin is the string
      // "null" — shared by every other opaque frame on the page and forgeable by
      // any of them. The window identity is the thing that is actually unique.
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }
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
      <YStack height="100%">
        <Header />
        <XStack flex={1} alignItems="center" justifyContent="center">
          <SizableText textAlign="center" rowGap="$2" display="flex" flexDirection="column">
            <RefreshCw size={32} />
            <Paragraph color="$color11">Compiling project...</Paragraph>
          </SizableText>
        </XStack>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack height="100%">
        <Header />
        <XStack flex={1} alignItems="center" justifyContent="center">
          <SizableText textAlign="center" color="$red9" rowGap="$2" display="flex" flexDirection="column">
            <Paragraph fontWeight="500">Error</Paragraph>
            <Paragraph fontSize="$3" marginTop="$2">{error}</Paragraph>
            <Button onClick={handleRefresh} marginTop="$4" paddingHorizontal="$4" paddingVertical="$2" backgroundColor="$color5" borderWidth={1} borderColor="$color6" borderRadius="$3">
              <SizableText color="$background">Try Again</SizableText>
            </Button>
          </SizableText>
        </XStack>
      </YStack>
    );
  }

  return (
    <YStack height="100%">
      <Header />

      {/* Controls */}
      <XStack borderBottomWidth={1} padding="$2" alignItems="center" gap="$2">
        <XStack alignItems="center" gap="$1">
          <Button
            onClick={handleBack}
            disabled={historyIndex === 0}
            height="$6" width="$6" alignItems="center" justifyContent="center" borderRadius="$2" hoverStyle={{ backgroundColor: "$color3" }} disabledStyle={{ opacity: 0.5 }}
            title="Back"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            onClick={handleForward}
            disabled={historyIndex >= navigationHistory.length - 1}
            height="$6" width="$6" alignItems="center" justifyContent="center" borderRadius="$2" hoverStyle={{ backgroundColor: "$color3" }} disabledStyle={{ opacity: 0.5 }}
            title="Forward"
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            onClick={handleHome}
            height="$6" width="$6" alignItems="center" justifyContent="center" borderRadius="$2" hoverStyle={{ backgroundColor: "$color3" }}
            title="Home"
          >
            <Home size={16} />
          </Button>
          <Button
            onClick={handleRefresh}
            height="$6" width="$6" alignItems="center" justifyContent="center" borderRadius="$2" hoverStyle={{ backgroundColor: "$color3" }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </Button>
        </XStack>

        <SizableText flex={1} paddingHorizontal="$3" paddingVertical="$1" backgroundColor="$color3" borderRadius="$2" fontSize="$3" display="flex" flexDirection="column">
          {activePath}
        </SizableText>

        {/* Device size controls */}
        <XStack alignItems="center" gap="$1" borderLeftWidth={1} paddingLeft="$2">
          <Button
            onClick={() => setDeviceSize('mobile')}
            height="$6" width="$6" alignItems="center" justifyContent="center" borderRadius="$2" {...{ backgroundColor: deviceSize === 'mobile' ? "$color12" : undefined, color: deviceSize === 'mobile' ? "$background" : undefined, hoverStyle: deviceSize === 'mobile' ? undefined : {"backgroundColor":"$color3"} }}
            title="Mobile view"
          >
            <Smartphone size={16} />
          </Button>
          <Button
            onClick={() => setDeviceSize('tablet')}
            height="$6" width="$6" alignItems="center" justifyContent="center" borderRadius="$2" {...{ backgroundColor: deviceSize === 'tablet' ? "$color12" : undefined, color: deviceSize === 'tablet' ? "$background" : undefined, hoverStyle: deviceSize === 'tablet' ? undefined : {"backgroundColor":"$color3"} }}
            title="Tablet view"
          >
            <Tablet size={16} />
          </Button>
          <Button
            onClick={() => setDeviceSize('desktop')}
            height="$6" width="$6" alignItems="center" justifyContent="center" borderRadius="$2" {...{ backgroundColor: deviceSize === 'desktop' ? "$color12" : undefined, color: deviceSize === 'desktop' ? "$background" : undefined, hoverStyle: deviceSize === 'desktop' ? undefined : {"backgroundColor":"$color3"} }}
            title="Desktop view"
          >
            <Monitor size={16} />
          </Button>
        </XStack>
      </XStack>

      {/* Preview Frame */}
      <YStack flex={1} backgroundColor="$color3" padding="$4" overflow="scroll" minHeight={0} $theme-dark={{ backgroundColor: "$color3" }}>
        <YStack
          backgroundColor="white" alignSelf="center" elevation={6} borderRadius="$5"
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
            style={{ width: "100%", height: "100%", borderRadius: 8 }}
            // NO `allow-same-origin`. With it, `allow-scripts` is the documented
            // no-op pair: the frame keeps THIS origin, so generated, imported and
            // forked HTML can read `top.localStorage` — where the IAM access and
            // refresh tokens live — and can drop its own sandbox. A refresh token
            // is account takeover, and an <img> beacon exfiltrates it silently
            // under a CSP that allows img-src https:.
            //
            // Nothing here needs it: this preview already talks to the host over
            // postMessage through an injected bridge, never through
            // `contentDocument`.
            sandbox="allow-scripts allow-forms"
            title="Preview"
  />
        </YStack>
      </YStack>
    </YStack>
  );
}
