import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/performance/web-vitals';
import { registerServiceWorker } from '@/lib/service-worker/register';
import type { NextWebVitalsMetric } from 'next/app';

export function reportWebVitalsMetrics(metric: NextWebVitalsMetric) {
  reportWebVitals(metric);
}

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }

    // Set up performance monitoring
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        import('@/lib/performance/web-vitals').then(({ getPerformanceMonitor }) => {
          const monitor = getPerformanceMonitor();

          // Custom performance thresholds
          monitor.setThresholds({
            cls: 0.1,
            fcp: 1800,
            lcp: 2500,
            ttfb: 600,
            fid: 100,
            inp: 200,
          });
        });
      });
    }
  }, []);

  return <>{children}</>;
}

export default PerformanceProvider;