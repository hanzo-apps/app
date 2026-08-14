'use client';

import { YStack, XStack, SizableText, Paragraph } from '@hanzo/ui';
import { useState, useEffect, useRef } from 'react';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, toast } from '@hanzo/ui';

interface HeatmapPoint {
  x: number;
  y: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
  documentHeight: number;
  elementSelector?: string;
  timestamp: string;
}

interface ClickHeatmapData {
  type: 'click';
  page: string;
  sampleSize: number;
  points: HeatmapPoint[];
}

interface ScrollHeatmapData {
  type: 'scroll';
  page: string;
  sampleSize: number;
  depthDistribution: Record<number, number>;
  rawData: Array<{
    scrollDepth: number;
    timeOnPage: number;
    timestamp: string;
  }>;
}

type HeatmapData = ClickHeatmapData | ScrollHeatmapData;

interface HeatmapViewerProps {
  deploymentId: string;
  pages: string[]; // Available pages to select from
}

export function HeatmapViewer({ deploymentId, pages }: HeatmapViewerProps) {
  const [selectedPage, setSelectedPage] = useState<string>(pages[0] || '/');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'tablet' | 'desktop'>('all');
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  // Cache screenshots by page to avoid re-capturing
  const [screenshotCache, setScreenshotCache] = useState<Record<string, string>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Monotonic id so only the LATEST in-flight fetch may apply its result. Page
  // and device switch in place via dropdowns (and there's a manual refresh), so
  // responses can resolve out of order — without this, a slow earlier response
  // overwrites a newer one and the canvas shows the wrong page's heatmap.
  const reqIdRef = useRef(0);

  // Fetch heatmap data
  const fetchHeatmapData = async () => {
    if (!selectedPage) return;

    const myId = ++reqIdRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: selectedPage,
        type: 'click',
      });

      if (deviceFilter !== 'all') {
        params.set('device', deviceFilter);
      }

      const response = await fetch(`/v1/analytics/${deploymentId}/heatmap?${params}`);
      if (!response.ok) throw new Error('Failed to fetch heatmap data');

      const heatmapData: HeatmapData = await response.json();
      if (myId === reqIdRef.current) setData(heatmapData);
    } catch (error) {
      if (myId !== reqIdRef.current) return;
      console.error('Failed to fetch heatmap data:', error);
      toast.error("Clicks didn't load. Switch page or device to try again.");
    } finally {
      if (myId === reqIdRef.current) setLoading(false);
    }
  };

  // Load data when page or device filter changes
  useEffect(() => {
    fetchHeatmapData();

    // Check if we have a cached screenshot for this page and device
    const cacheKey = `${selectedPage}-${deviceFilter}`;
    if (screenshotCache[cacheKey]) {
      setScreenshotDataUrl(screenshotCache[cacheKey]);
    } else {
      setScreenshotDataUrl(null);
    }
  }, [selectedPage, deviceFilter, deploymentId]);

  // Capture screenshot - use same approach as thumbnail capture
  const captureScreenshot = async () => {
    if (!iframeRef.current) return;

    setScreenshotLoading(true);
    try {
      // Dynamically import screenshot utility
      const { captureIframeScreenshot } = await import('@/lib/utils/screenshot');

      const iframe = iframeRef.current;

      // Determine capture dimensions based on device filter
      let captureWidth = 1280;
      let captureHeight = 720;

      if (deviceFilter === 'mobile') {
        captureWidth = 375;
        captureHeight = 667; // iPhone SE size
      } else if (deviceFilter === 'tablet') {
        captureWidth = 768;
        captureHeight = 1024; // iPad size
      }
      // 'all' and 'desktop' use default 1280x720

      // Set iframe size to match capture dimensions
      iframe.style.width = `${captureWidth}px`;
      iframe.style.height = `${captureHeight}px`;

      // Load the published page URL directly (same as thumbnail capture)
      // This avoids CORS issues since it's same-origin
      iframe.src = selectedPage;

      // Wait for iframe to fully load
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

        iframe.onload = () => {
          clearTimeout(timeout);
          resolve(null);
        };

        iframe.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load page'));
        };
      });

      // Wait for any dynamic content to render (match thumbnail behavior)
      await new Promise(r => setTimeout(r, 500));

      // Capture screenshot at device-specific dimensions
      const dataUrl = await captureIframeScreenshot(iframe, captureWidth, captureHeight);

      if (dataUrl) {
        setScreenshotDataUrl(dataUrl);
        // Cache the screenshot for this page and device
        const cacheKey = `${selectedPage}-${deviceFilter}`;
        setScreenshotCache(prev => ({ ...prev, [cacheKey]: dataUrl }));
      } else {
        toast.error('The screenshot came back empty. Capture it again.');
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      toast.error("Couldn't capture the page. It may not have finished loading — try again.");
    } finally {
      setScreenshotLoading(false);
    }
  };

  // Render click heatmap on canvas with screenshot background
  useEffect(() => {
    if (!canvasRef.current || !data || data.type !== 'click' || !screenshotDataUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load screenshot image
    const img = new Image();
    img.onload = () => {
      // Set canvas size to screenshot size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw screenshot as background
      ctx.drawImage(img, 0, 0);

      // Calculate absolute Y positions and scale to screenshot dimensions
      const screenshotWidth = canvas.width;

      const transformedPoints = data.points.map((point) => {
        // Scale factor based on viewport width where click was recorded vs screenshot width
        const scale = screenshotWidth / point.viewportWidth;

        // Handle missing or invalid scrollY with fallback to 0
        const scrollY = Number.isFinite(point.scrollY) ? point.scrollY : 0;

        return {
          x: point.x * scale,
          y: (point.y + scrollY) * scale, // Absolute Y position, scaled
          viewportWidth: point.viewportWidth,
          scale,
        };
      });

      const points = transformedPoints
        // Filter out invalid coordinates (NaN, Infinity, negative, etc.)
        .filter((point) => {
          return (
            Number.isFinite(point.x) &&
            Number.isFinite(point.y) &&
            point.x >= 0 &&
            point.y >= 0 &&
            point.x <= canvas.width &&
            point.y <= canvas.height
          );
        });

      // Draw heatmap using radial gradients
      points.forEach((point) => {
        // Scale radius too
        const radius = 40 * point.scale;

        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.7)');
        gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
      });
    };
    img.src = screenshotDataUrl;
  }, [data, screenshotDataUrl]);

  return (
    <YStack rowGap="$4">
      {/* Controls */}
      <XStack gap="$4" alignItems="flex-end" flexWrap="wrap">
        <YStack minWidth="$19">
          <Label htmlFor="page-select">Page</Label>
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger id="page-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page} value={page}>
                  {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </YStack>

        <YStack minWidth="$15">
          <Label htmlFor="device-select">Device</Label>
          <Select value={deviceFilter} onValueChange={(value) => setDeviceFilter(value as any)}>
            <SelectTrigger id="device-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All devices</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
            </SelectContent>
          </Select>
        </YStack>

        <Button onClick={fetchHeatmapData} disabled={loading}>
          {loading ? 'Loading…' : 'Reload'}
        </Button>
      </XStack>

      {/* Sample Size */}
      {data && (
        <SizableText fontSize="$3" color="$color11">
          Sample size: <SizableText fontWeight="500">{data.sampleSize.toLocaleString()}</SizableText> interactions
        </SizableText>
      )}

      {/* Visualization */}
      {loading && (
        <XStack alignItems="center" justifyContent="center" height={384} borderWidth={1} borderRadius="$5">
          <Paragraph color="$color11">Loading clicks…</Paragraph>
        </XStack>
      )}

      {!loading && data && data.type === 'click' && (
        <YStack borderWidth={1} borderRadius="$5" overflow="hidden">
          {!screenshotDataUrl && !screenshotLoading && (
            <YStack padding="$6">
              <Paragraph color="$color11" marginBottom="$4" textAlign="center">The heatmap paints clicks onto a picture of the page. Capture one to see them.</Paragraph>
              <Button onClick={captureScreenshot}>Capture the page</Button>
            </YStack>
          )}

          {screenshotLoading && (
            <YStack padding="$6">
              <Paragraph color="$color11" textAlign="center">Capturing the page…</Paragraph>
            </YStack>
          )}

          {screenshotDataUrl && (
            <>
              <YStack backgroundColor="$color3" padding="$4" overflow="scroll" style={{ maxHeight: '70vh' }}>
                <canvas
                  ref={canvasRef}
                  style={{ maxWidth: '100%', height: 'auto', margin: '0 auto', display: 'block' }}
  />
              </YStack>

              <YStack padding="$4" backgroundColor="$color3" borderTopWidth={1}>
                <XStack alignItems="center" justifyContent="space-between">
                  <div>
                    <Paragraph fontWeight="500" fontSize="$3" marginBottom="$2">What the colours mean</Paragraph>
                    <XStack gap="$4">
                      <XStack alignItems="center" gap="$2">
                        <YStack width="$4" height="$4" borderRadius="$2" backgroundColor="$red9" />
                        <SizableText fontSize="$3">High activity</SizableText>
                      </XStack>
                      <XStack alignItems="center" gap="$2">
                        <YStack width="$4" height="$4" borderRadius="$2" backgroundColor="$orange9" />
                        <SizableText fontSize="$3">Medium activity</SizableText>
                      </XStack>
                      <XStack alignItems="center" gap="$2">
                        <YStack width="$4" height="$4" borderRadius="$2" backgroundColor="$yellow9" />
                        <SizableText fontSize="$3">Low activity</SizableText>
                      </XStack>
                    </XStack>
                  </div>
                  <YStack>
                    <Button variant="outline" size="sm" onClick={captureScreenshot}>
                      Capture again
                    </Button>
                  </YStack>
                </XStack>
              </YStack>
            </>
          )}

          {/* Hidden iframe for screenshot capture - positioned off-screen with dynamic dimensions */}
          <iframe
            ref={iframeRef}
            style={{
              position: 'fixed',
              top: '-10000px',
              left: '-10000px',
              border: 'none'
              // Width and height set dynamically in captureScreenshot()
            }}
            title="Page for screenshot"
  />
        </YStack>
      )}

      {!loading && !data && (
        <XStack alignItems="center" justifyContent="center" height={384} borderWidth={1} borderRadius="$5">
          <Paragraph color="$color11">No clicks recorded on this page yet. Try another page, or come back once people have visited.</Paragraph>
        </XStack>
      )}
    </YStack>
  );
}
