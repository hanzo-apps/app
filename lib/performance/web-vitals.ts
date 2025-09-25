import { onCLS, onFCP, onFID, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

export interface PerformanceMetrics {
  cls: number | null;
  fcp: number | null;
  fid: number | null;
  lcp: number | null;
  ttfb: number | null;
  inp: number | null;
}

export interface PerformanceReport {
  metrics: PerformanceMetrics;
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  memory?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    cls: null,
    fcp: null,
    fid: null,
    lcp: null,
    ttfb: null,
    inp: null,
  };

  private reportCallback: ((report: PerformanceReport) => void) | null = null;
  private reportingEnabled = true;
  private reportingThreshold = {
    cls: 0.1,
    fcp: 2500,
    fid: 100,
    lcp: 2500,
    ttfb: 800,
    inp: 200,
  };

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    // Core Web Vitals
    onCLS(this.handleMetric('cls'));
    onFCP(this.handleMetric('fcp'));
    onFID(this.handleMetric('fid'));
    onLCP(this.handleMetric('lcp'));
    onTTFB(this.handleMetric('ttfb'));
    onINP(this.handleMetric('inp'));

    // Additional performance monitoring
    this.monitorLongTasks();
    this.monitorResourceTiming();
    this.monitorMemoryUsage();
  }

  private handleMetric = (metricName: keyof PerformanceMetrics) => (metric: Metric) => {
    this.metrics[metricName] = metric.value;

    // Check if metric exceeds threshold
    const threshold = this.reportingThreshold[metricName];
    if (metric.value > threshold) {
      console.warn(`Performance warning: ${metricName} = ${metric.value}ms exceeds threshold of ${threshold}ms`);
    }

    // Report if all core metrics are collected
    if (this.shouldReport()) {
      this.report();
    }
  };

  private shouldReport(): boolean {
    return (
      this.metrics.cls !== null &&
      this.metrics.fcp !== null &&
      this.metrics.lcp !== null &&
      this.metrics.ttfb !== null
    );
  }

  private monitorLongTasks() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.debug('Long task monitoring not supported');
    }
  }

  private monitorResourceTiming() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;

          // Log slow resources
          if (resourceEntry.duration > 1000) {
            console.warn('Slow resource detected:', {
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              transferSize: resourceEntry.transferSize,
              type: resourceEntry.initiatorType,
            });
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.debug('Resource timing monitoring not supported');
    }
  }

  private monitorMemoryUsage() {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    // Check memory usage periodically
    setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);

        // Warn if memory usage is high
        if (usedMB > totalMB * 0.9) {
          console.warn(`High memory usage: ${usedMB}MB / ${totalMB}MB`);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  public report() {
    if (!this.reportingEnabled) return;

    const report: PerformanceReport = {
      metrics: { ...this.metrics },
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Add connection info if available
    const connection = (navigator as any).connection;
    if (connection) {
      report.connection = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      };
    }

    // Add memory info if available
    const memory = (performance as any).memory;
    if (memory) {
      report.memory = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }

    // Send report
    if (this.reportCallback) {
      this.reportCallback(report);
    } else {
      this.sendToAnalytics(report);
    }
  }

  private async sendToAnalytics(report: PerformanceReport) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Performance Report:', report);
      return;
    }

    try {
      // Send to your analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }

  public setReportCallback(callback: (report: PerformanceReport) => void) {
    this.reportCallback = callback;
  }

  public setReportingEnabled(enabled: boolean) {
    this.reportingEnabled = enabled;
  }

  public setThresholds(thresholds: Partial<typeof this.reportingThreshold>) {
    this.reportingThreshold = { ...this.reportingThreshold, ...thresholds };
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public reset() {
    this.metrics = {
      cls: null,
      fcp: null,
      fid: null,
      lcp: null,
      ttfb: null,
      inp: null,
    };
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor!;
}

// Helper functions
export function reportWebVitals(metric: Metric) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      rating: metric.rating,
    });

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', body);
    } else {
      fetch('/api/analytics/vitals', {
        method: 'POST',
        body,
        keepalive: true,
      }).catch(console.error);
    }
  } else {
    console.log(`[${metric.name}]:`, metric);
  }
}

// Performance marks for custom timing
export function markPerformance(name: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(name);
  }
}

export function measurePerformance(name: string, startMark: string, endMark?: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    if (endMark) {
      performance.measure(name, startMark, endMark);
    } else {
      performance.measure(name, startMark);
    }

    const entries = performance.getEntriesByName(name, 'measure');
    if (entries.length > 0) {
      const duration = entries[entries.length - 1].duration;
      console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
      return duration;
    }
  }
  return 0;
}

// Utility to check if page is being throttled
export function isPageThrottled(): boolean {
  if (typeof document === 'undefined') return false;

  return document.hidden || document.visibilityState !== 'visible';
}

// Export default monitor
export default getPerformanceMonitor();