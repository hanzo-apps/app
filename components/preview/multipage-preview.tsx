'use client';

import { XStack, H3, YStack, SizableText, Paragraph } from '@hanzo/gui';
import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { VirtualServer } from '@/lib/preview/virtual-server';
import {
  CompiledProject,
  PreviewMessage,
  FocusContextPayload,
  PreviewHostMessage
} from '@/lib/preview/types';
import { vfs } from '@/lib/vfs';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import {
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Home,
  Eye,
  Crosshair,
  Camera,
  Loader2,
  X
} from 'lucide-react';
import { logger } from '@/lib/utils';
import { captureIframeScreenshot } from '@/lib/utils/screenshot';
import type { ProjectRuntime } from '@/lib/vfs/types';

export interface MultipagePreviewHandle {
  captureScreenshot: (waitForContent?: boolean) => Promise<string | null>;
}

interface MultipagePreviewProps {
  projectId: string;
  currentPath?: string;
  refreshTrigger?: number;
  onFocusSelection?: (selection: FocusContextPayload | null) => void;
  hasFocusTarget?: boolean;
  onClose?: () => void;
  deploymentId?: string | null;
  onCaptureScreenshot?: (screenshot: string) => void;
  entryPoint?: string;
  runtime?: ProjectRuntime;
}

type DeviceSize = 'mobile' | 'tablet' | 'desktop' | 'responsive';

const DEVICE_SIZES: Record<DeviceSize, { width?: string; height?: string; maxHeight?: string; maxWidth?: string }> = {
  mobile: { width: '375px', height: '100%', maxHeight: '667px' },
  tablet: { width: '768px', height: '100%', maxHeight: '1024px' },
  desktop: { width: '100%', height: '100%', maxHeight: '900px', maxWidth: '1440px' },
  responsive: { width: '100%', height: '100%' }
};

const MultipagePreviewComponent = forwardRef<MultipagePreviewHandle, MultipagePreviewProps>(({
  projectId,
  refreshTrigger,
  onFocusSelection,
  hasFocusTarget = false,
  onClose,
  deploymentId,
  onCaptureScreenshot,
  entryPoint,
  runtime
}, ref) => {
  const [compiledProject, setCompiledProject] = useState<CompiledProject | null>(null);
  const [activePath, setActivePath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('tablet');
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['/']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [iframeReady, setIframeReady] = useState(false);
  const [selectorActive, setSelectorActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCaptureClick = useCallback(async () => {
    if (!iframeRef.current || !iframeReady || !onCaptureScreenshot) return;
    setIsCapturing(true);
    try {
      const screenshot = await captureIframeScreenshot(
        iframeRef.current,
        undefined, undefined, undefined, undefined, undefined, undefined,
        false, 1500
      );
      if (screenshot) onCaptureScreenshot(screenshot);
    } finally {
      setIsCapturing(false);
    }
  }, [iframeReady, onCaptureScreenshot]);

  const crosshairButtonStyle = useMemo(() => {
    if (selectorActive) {
      return { backgroundColor: 'var(--brand-accent)', color: 'var(--brand-accent-fg)' };
    }
    if (hasFocusTarget) {
      // The armed-but-not-active state is the accent at low alpha. It was an
      // indigo literal at 12% — not even the app's purple, so it could not
      // follow the host; --brand-accent-soft is that idea already named, and it
      // moves when the accent does.
      return { backgroundColor: 'var(--brand-accent-soft)', color: 'var(--brand-accent)' };
    }
    return {};
  }, [selectorActive, hasFocusTarget]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const serverRef = useRef<VirtualServer | null>(null);
  const compiledProjectRef = useRef<CompiledProject | null>(null);
  const activePathRef = useRef<string>('/');
  const pendingLoadPath = useRef<string | null>(null);
  const selectorActiveRef = useRef(false);

  // Expose captureScreenshot method via ref
  useImperativeHandle(ref, () => ({
    captureScreenshot: async (waitForContent?: boolean) => {
      if (!iframeRef.current || !iframeReady) {
        logger.warn('Cannot capture screenshot: iframe not ready');
        return null;
      }
      return await captureIframeScreenshot(
        iframeRef.current,
        undefined, undefined, undefined, undefined, undefined, undefined,
        waitForContent ?? false,
        1500
      );
    }
  }), [iframeReady]);

  const postMessageToIframe = useCallback((message: PreviewHostMessage) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      return;
    }
    try {
      iframeRef.current.contentWindow.postMessage(message, '*');
    } catch (err) {
      logger.warn('Failed to communicate with preview iframe', err);
    }
  }, []);

  const compilingRef = useRef(false);
  const pendingCompileOptionsRef = useRef<{ preserve: boolean; showLoading: boolean } | null>(null);
  const compileTimeoutRef = useRef<number | null>(null);
  const scheduledCompileOptionsRef = useRef<{ preserve: boolean; showLoading: boolean } | null>(null);

  const Header = () => (
    <XStack padding="$3" borderBottomWidth={1} backgroundColor="$color3" alignItems="center" gap="$2">
      <Eye 
        size={16} 
        style={{ color: 'var(--brand-accent)' }} 
  />
      {onClose ? (
        <Button
          type="button"
          onClick={onClose}
          aria-label="Hide preview"
          position="relative" display="none" height="$5" width="$5" alignItems="center" justifyContent="center" borderRadius="$1" group {...{ color: "$color11" }}
        >
          <Eye 
            size={16} 
            style={{ color: 'var(--brand-accent)' }} 
  />
          <X size={12} />
        </Button>
      ) : (
        <Eye 
          size={16} 
          style={{ color: 'var(--brand-accent)' }} 
  />
      )}
      <H3 fontSize="$3" fontWeight="500">Live Preview</H3>
    </XStack>
  );

  useEffect(() => {
    compiledProjectRef.current = compiledProject;
  }, [compiledProject]);

  useEffect(() => {
    selectorActiveRef.current = selectorActive;
    if (iframeReady) {
      postMessageToIframe({ type: 'selector-toggle', active: selectorActive });
    }
  }, [selectorActive, iframeReady, postMessageToIframe]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }
    const handleLoad = () => {
      postMessageToIframe({ type: 'selector-toggle', active: selectorActiveRef.current });
    };
    iframe.addEventListener('load', handleLoad);
    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [iframeReady, postMessageToIframe]);

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

  useEffect(() => {
    return () => {
      if (compileTimeoutRef.current) {
        window.clearTimeout(compileTimeoutRef.current);
      }
    };
  }, []);

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
      
      const server = new VirtualServer(vfs, projectId, undefined, deploymentId || undefined, entryPoint, runtime);
      serverRef.current = server;
      
      const compiled = await server.compileProject();
      setCompiledProject(compiled);
      compiledProjectRef.current = compiled;

      let pathToLoad = currentPath;
      if (!pathToLoad) {
        const ep = compiled.entryPoint || '/index.html';
        if (ep !== '/index.html' && compiled.blobUrls.has(ep)) {
          // Non-default entry point — navigate directly to it
          pathToLoad = ep;
        } else {
          pathToLoad = compiled.blobUrls.has(ep) ? '/' :
                       (compiled.routes.length > 0 ? compiled.routes[0].path : '/');
        }
      }
      
      loadPage(pathToLoad, compiled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compile project');
      logger.error('Compilation error:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [projectId, deploymentId]);

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

  const scheduleCompile = useCallback((preserveCurrentPath = false, showLoading = false) => {
    const pending = scheduledCompileOptionsRef.current;
    scheduledCompileOptionsRef.current = {
      preserve: (pending?.preserve ?? false) || preserveCurrentPath,
      showLoading: (pending?.showLoading ?? false) || showLoading
    };

    if (compileTimeoutRef.current) {
      window.clearTimeout(compileTimeoutRef.current);
    }

    compileTimeoutRef.current = window.setTimeout(() => {
      const options = scheduledCompileOptionsRef.current;
      scheduledCompileOptionsRef.current = null;
      compileTimeoutRef.current = null;
      if (options) {
        compileAndLoad(options.preserve, options.showLoading);
      }
    }, 150);
  }, [compileAndLoad]);


  useEffect(() => {
    compileAndLoad();
  }, [projectId, refreshTrigger, compileAndLoad]);

  useEffect(() => {
    const handleFileChange = () => {
      scheduleCompile(true);
    };

    const handleFileContentChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ projectId?: string }>;
      if (!customEvent.detail || customEvent.detail.projectId === projectId) {
        scheduleCompile(true);
      }
    };

    window.addEventListener('filesChanged', handleFileChange as EventListener);
    window.addEventListener('fileContentChanged', handleFileContentChange as EventListener);
    return () => {
      window.removeEventListener('filesChanged', handleFileChange as EventListener);
      window.removeEventListener('fileContentChanged', handleFileContentChange as EventListener);
    };
  }, [projectId, scheduleCompile]);


  const loadPage = (path: string, compiled?: CompiledProject) => {
    const projectToUse = compiled || compiledProjectRef.current || compiledProject;

    if (!projectToUse) {
      logger.warn('No compiled project available');
      return;
    }

    if (selectorActiveRef.current) {
      setSelectorActive(false);
    } else {
      postMessageToIframe({ type: 'selector-toggle', active: false });
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
    } else if (normalizedPath.endsWith('.html')) {
      // Already a full file path (e.g., entry point like /.renderer/index.html)
      filePath = normalizedPath;
    } else if (normalizedPath.endsWith('/')) {
      // Directory path - look for index.html
      filePath = normalizedPath + 'index.html';
    } else {
      filePath = normalizedPath + '.html';
    }

    let htmlFile = projectToUse.files.find(f => f.path === filePath);

    // If not found and path doesn't end with /, try directory index as fallback
    if (!htmlFile && !normalizedPath.endsWith('/')) {
      const dirIndexPath = normalizedPath + '/index.html';
      htmlFile = projectToUse.files.find(f => f.path === dirIndexPath);
      if (htmlFile) {
        filePath = dirIndexPath;
      }
    }

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
    
    processedHtml = processedHtml.replace(/href="([^"]+)"/g, (match, href) => {
      // Skip if not a CSS file or if it's an external URL
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
    
    processedHtml = processedHtml.replace(/src="([^"]+\.(png|jpg|jpeg|gif|svg|webp))"/gi, (match, imgPath) => {
      const normalizedImgPath = imgPath.startsWith('/') ? imgPath : '/' + imgPath;
      const blobUrl = projectToUse.blobUrls.get(normalizedImgPath);
      return blobUrl ? `src="${blobUrl}"` : match;
    });

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

          const selectorState = {
            active: false,
            overlay: null,
            lastTarget: null,
            previousCursor: ''
          };

          function isElement(node) {
            return node && node.nodeType === 1;
          }

          function ensureOverlay() {
            if (selectorState.overlay) {
              return selectorState.overlay;
            }
            const overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.pointerEvents = 'none';
            overlay.style.border = '2px solid rgba(99, 102, 241, 0.95)';
            overlay.style.background = 'rgba(99, 102, 241, 0.08)';
            overlay.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.32), 0 20px 40px rgba(15, 23, 42, 0.28)';
            overlay.style.borderRadius = '12px';
            overlay.style.zIndex = '2147483647';
            overlay.style.transition = 'top 0.12s ease-out, left 0.12s ease-out, width 0.12s ease-out, height 0.12s ease-out';
            overlay.style.willChange = 'top, left, width, height';
            selectorState.overlay = overlay;
            document.body.appendChild(overlay);
            return overlay;
          }

          function positionOverlay(target) {
            if (!isElement(target)) {
              return;
            }
            const overlay = ensureOverlay();
            const rect = target.getBoundingClientRect();
            overlay.style.top = (rect.top + window.scrollY) + 'px';
            overlay.style.left = (rect.left + window.scrollX) + 'px';
            overlay.style.width = Math.max(rect.width, 1) + 'px';
            overlay.style.height = Math.max(rect.height, 1) + 'px';
            overlay.style.opacity = '1';
          }

          function clearOverlay() {
            if (selectorState.overlay && selectorState.overlay.parentElement) {
              selectorState.overlay.parentElement.removeChild(selectorState.overlay);
            }
            selectorState.overlay = null;
          }

          function buildDomPath(element) {
            if (!isElement(element)) {
              return '';
            }
            const segments = [];
            let current = element;
            while (current && current.nodeType === 1) {
              let segment = current.tagName.toLowerCase();
              if (current.id) {
                segment += '#' + current.id;
                segments.unshift(segment);
                break;
              }
              const parent = current.parentElement;
              if (parent) {
                const siblings = parent.children;
                let index = 0;
                for (let i = 0; i < siblings.length; i++) {
                  if (siblings[i].tagName === current.tagName) {
                    index++;
                  }
                  if (siblings[i] === current) {
                    if (index > 1) {
                      segment += ':nth-of-type(' + index + ')';
                    } else {
                      const hasSame = Array.from(siblings).some(function(child, childIndex) {
                        return childIndex !== i && child.tagName === current.tagName;
                      });
                      if (hasSame) {
                        segment += ':nth-of-type(' + index + ')';
                      }
                    }
                    break;
                  }
                }
              }
              segments.unshift(segment);
              current = parent;
            }
            return segments.join(' > ');
          }

          function gatherAttributes(element) {
            const attributes = {};
            if (!isElement(element) || !element.attributes) {
              return attributes;
            }
            const maxAttributes = 25;
            for (let i = 0; i < element.attributes.length && i < maxAttributes; i++) {
              const attr = element.attributes[i];
              if (!attr) continue;
              const name = attr.name;
              if (!name || name === 'style' || name.startsWith('on')) {
                continue;
              }
              attributes[name] = attr.value;
            }
            return attributes;
          }

          function handleMouseMove(event) {
            if (!selectorState.active) {
              return;
            }
            const target = isElement(event.target) ? event.target : (event.target && event.target.parentElement);
            if (!isElement(target) || target === selectorState.lastTarget) {
              return;
            }
            selectorState.lastTarget = target;
            positionOverlay(target);
          }

          function handleClick(event) {
            if (!selectorState.active) {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === 'function') {
              event.stopImmediatePropagation();
            }
            const target = isElement(event.target) ? event.target : (event.target && event.target.parentElement);
            if (!isElement(target)) {
              disableSelector(false);
              return;
            }
            const payload = {
              domPath: buildDomPath(target),
              tagName: target.tagName.toLowerCase(),
              attributes: gatherAttributes(target),
              outerHTML: target.outerHTML || ''
            };
            if (isInIframe) {
              window.parent.postMessage({ type: 'selector-selection', payload: payload }, '*');
            }
            disableSelector(false);
          }

          function handleContextMenu(event) {
            if (!selectorState.active) {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
          }

          function handleKeyDown(event) {
            if (!selectorState.active) {
              return;
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              disableSelector(true);
            }
          }

          function enableSelector() {
            if (selectorState.active) {
              return;
            }
            selectorState.active = true;
            selectorState.previousCursor = document.body.style.cursor;
            const overlay = ensureOverlay();
            overlay.style.opacity = '0';
            document.body.style.cursor = 'crosshair';
            document.addEventListener('mousemove', handleMouseMove, true);
            document.addEventListener('click', handleClick, true);
            document.addEventListener('contextmenu', handleContextMenu, true);
            document.addEventListener('keydown', handleKeyDown, true);
          }

          function disableSelector(notifyCancel) {
            if (!selectorState.active) {
              return;
            }
            selectorState.active = false;
            selectorState.lastTarget = null;
            if (selectorState.overlay) {
              selectorState.overlay.style.opacity = '0';
              window.setTimeout(clearOverlay, 120);
            } else {
              clearOverlay();
            }
            document.body.style.cursor = selectorState.previousCursor || '';
            document.removeEventListener('mousemove', handleMouseMove, true);
            document.removeEventListener('click', handleClick, true);
            document.removeEventListener('contextmenu', handleContextMenu, true);
            document.removeEventListener('keydown', handleKeyDown, true);
            if (notifyCancel && isInIframe) {
              window.parent.postMessage({ type: 'selector-cancelled' }, '*');
            }
          }

          window.addEventListener('message', function(event) {
            const data = event.data;
            if (!data || typeof data !== 'object') {
              return;
            }
            if (data.type === 'selector-toggle') {
              if (data.active) {
                enableSelector();
              } else {
                disableSelector(false);
              }
            }
          });
        })();
      </script>
    `;
    
    // Expose the complete blob-URL map to the iframe so the runtime fetch/XHR
    // interceptor can resolve any VFS path (e.g. fetch('/components/nav.html')),
    // not just the partial map baked into the page during compilation.
    const vfsMapJson = JSON.stringify(Object.fromEntries(projectToUse.blobUrls)).replace(/</g, '\\u003c');
    const vfsMapScript = `<script>window.__hanzoVfsBlobUrls = ${vfsMapJson};</script>`;
    if (processedHtml.includes('<head>')) {
      processedHtml = processedHtml.replace('<head>', '<head>' + vfsMapScript);
    } else {
      processedHtml = vfsMapScript + processedHtml;
    }

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

      if (data.type === 'selector-selection' && data.payload) {
        setSelectorActive(false);
        onFocusSelection?.(data.payload);
        return;
      }

      if (data.type === 'selector-cancelled') {
        setSelectorActive(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleNavigation, onFocusSelection]);

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
          <YStack rowGap="$2">
            <RefreshCw size={32} color="$color12" />
            <Paragraph color="$color11" textAlign="center">Compiling project...</Paragraph>
          </YStack>
        </XStack>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack height="100%">
        <Header />
        <XStack flex={1} alignItems="center" justifyContent="center">
          <YStack rowGap="$2">
            <Paragraph fontWeight="500" color="$red9" textAlign="center">Error</Paragraph>
            <Paragraph fontSize="$3" marginTop="$2" color="$red9" textAlign="center">{error}</Paragraph>
            <Button onClick={handleRefresh} marginTop="$4">
              Try Again
            </Button>
          </YStack>
        </XStack>
      </YStack>
    );
  }

  return (
    <YStack height="100%">
      <Header />
      {/* Mobile Layout - Single row with navigation and page selector */}
      <XStack borderBottomWidth={1} padding="$2" alignItems="center" gap="$2" $md={{ display: "none" }}>
        <XStack alignItems="center" gap="$1">
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={handleBack}
            disabled={historyIndex === 0}
          >
            <ChevronLeft size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={handleForward}
            disabled={historyIndex >= navigationHistory.length - 1}
          >
            <ChevronRight size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={handleHome}
          >
            <Home size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={handleRefresh}
          >
            <RefreshCw size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={() => setSelectorActive(prev => !prev)}
            disabled={!iframeReady}
            style={crosshairButtonStyle}
            title={selectorActive ? 'Cancel element selection' : hasFocusTarget ? 'Replace focused element' : 'Select element'}
            data-tour-id="focus-crosshair-button"
          >
            <Crosshair size={12} />
          </Button>
          {onCaptureScreenshot && (
            <Button
              size="icon"
              variant="ghost"
              height="$4.5" width="$4.5"
              onClick={handleCaptureClick}
              disabled={!iframeReady || isCapturing}
              title="Capture screenshot as thumbnail"
            >
              {isCapturing ? <Loader2 size={12} /> : <Camera size={12} />}
            </Button>
          )}
        </XStack>

        {/* Page selector takes remaining space */}
        {compiledProject && compiledProject.routes.length > 1 && (
          <Select value={activePath} onValueChange={handleNavigation}>
            <SelectTrigger flex={1} height="$6" minWidth={0} maxWidth="100%">
              <SelectValue numberOfLines={1} />
            </SelectTrigger>
            <SelectContent>
              {compiledProject.routes.map(route => (
                <SelectItem key={route.path} value={route.path}>
                  {route.title || route.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </XStack>

      {/* Desktop Layout - Single row */}
      <YStack borderBottomWidth={1} padding="$2" display="none" alignItems="center" gap="$2">
        <XStack alignItems="center" gap="$1">
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={handleBack}
            disabled={historyIndex === 0}
          >
            <ChevronLeft size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={handleForward}
            disabled={historyIndex >= navigationHistory.length - 1}
          >
            <ChevronRight size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={handleHome}
          >
            <Home size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={handleRefresh}
          >
            <RefreshCw size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5"
            onClick={() => setSelectorActive(prev => !prev)}
            disabled={!iframeReady}
            style={{
              backgroundColor: selectorActive ? 'var(--brand-accent)' : undefined,
              color: selectorActive ? 'var(--brand-accent-fg)' : undefined
            }}
            title={selectorActive ? 'Cancel element focus' : 'Select element'}
            data-tour-id="focus-crosshair-button"
          >
            <Crosshair size={12} />
          </Button>
          {onCaptureScreenshot && (
            <Button
              size="icon"
              variant="ghost"
              height="$4.5" width="$4.5"
              onClick={handleCaptureClick}
              disabled={!iframeReady || isCapturing}
              title="Capture screenshot as thumbnail"
            >
              {isCapturing ? <Loader2 size={12} /> : <Camera size={12} />}
            </Button>
          )}
        </XStack>

        <SizableText flex={1} paddingHorizontal="$3" paddingVertical="$1" backgroundColor="$color3" borderRadius="$2" fontSize="$3">
          {activePath}
        </SizableText>

        {compiledProject && compiledProject.routes.length > 1 && (
          <Select value={activePath} onValueChange={handleNavigation}>
            <SelectTrigger width={200} height="$6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {compiledProject.routes.map(route => (
                <SelectItem key={route.path} value={route.path}>
                  {route.title || route.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <XStack alignItems="center" gap="$1" borderLeftWidth={1} paddingLeft="$2">
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5" borderRadius="$1"
            style={{
              backgroundColor: deviceSize === 'mobile' ? 'var(--brand-accent)' : undefined,
              color: deviceSize === 'mobile' ? 'var(--brand-accent-fg)' : undefined
            }}
            onClick={() => setDeviceSize('mobile')}
          >
            <Smartphone size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5" borderRadius="$1"
            style={{
              backgroundColor: deviceSize === 'tablet' ? 'var(--brand-accent)' : undefined,
              color: deviceSize === 'tablet' ? 'var(--brand-accent-fg)' : undefined
            }}
            onClick={() => setDeviceSize('tablet')}
          >
            <Tablet size={12} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            height="$4.5" width="$4.5" borderRadius="$1"
            style={{
              backgroundColor: deviceSize === 'desktop' ? 'var(--brand-accent)' : undefined,
              color: deviceSize === 'desktop' ? 'var(--brand-accent-fg)' : undefined
            }}
            onClick={() => setDeviceSize('desktop')}
          >
            <Monitor size={12} />
          </Button>
        </XStack>
      </YStack>

      {/* Preview Frame */}
      <YStack flex={1} backgroundColor="$color3" padding="$4" overflow="scroll" minHeight={0} $theme-dark={{ backgroundColor: "$color3" }}>
        <YStack 
          backgroundColor="white" alignSelf="center" elevation={6} {...{ borderRadius: deviceSize !== 'responsive' ? "$5" : undefined }}
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
                // Use setTimeout to ensure iframe document is ready
                setTimeout(() => {
                  setIframeReady(true);
                }, 0);
              } else if (!el && iframeReady) {
                setIframeReady(false);
              }
            }}
            style={{ width: "100%", height: "100%", borderRadius: 8 }}
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="Preview"
  />
        </YStack>
      </YStack>
    </YStack>
  );
});

MultipagePreviewComponent.displayName = 'MultipagePreview';

export const MultipagePreview = React.memo(MultipagePreviewComponent);
