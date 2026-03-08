import { useState, useEffect, useCallback } from 'react';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface NavigationTiming {
  dnsLookup: number;
  tcpConnection: number;
  serverResponse: number;
  domParsing: number;
  domContentLoaded: number;
  pageLoad: number;
}

export interface ResourceEntry {
  name: string;
  type: string;
  duration: number;
  size: number;
}

export interface ErrorEntry {
  message: string;
  source: string;
  timestamp: Date;
  count: number;
}

function rateMetric(name: string, value: number): PerformanceMetric['rating'] {
  const thresholds: Record<string, [number, number]> = {
    FCP: [1800, 3000],
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    TTFB: [800, 1800],
  };
  const t = thresholds[name];
  if (!t) return 'good';
  if (value <= t[0]) return 'good';
  if (value <= t[1]) return 'needs-improvement';
  return 'poor';
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [navigation, setNavigation] = useState<NavigationTiming | null>(null);
  const [resources, setResources] = useState<ResourceEntry[]>([]);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [memoryUsage, setMemoryUsage] = useState<{ used: number; total: number; limit: number } | null>(null);

  const collectMetrics = useCallback(() => {
    const newMetrics: PerformanceMetric[] = [];

    // Navigation Timing
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      const ttfb = nav.responseStart - nav.requestStart;
      newMetrics.push({ name: 'TTFB', value: Math.round(ttfb), rating: rateMetric('TTFB', ttfb) });

      setNavigation({
        dnsLookup: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
        tcpConnection: Math.round(nav.connectEnd - nav.connectStart),
        serverResponse: Math.round(nav.responseStart - nav.requestStart),
        domParsing: Math.round(nav.domInteractive - nav.responseEnd),
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        pageLoad: Math.round(nav.loadEventEnd - nav.startTime),
      });
    }

    // Paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
    if (fcp) {
      newMetrics.push({ name: 'FCP', value: Math.round(fcp.startTime), rating: rateMetric('FCP', fcp.startTime) });
    }

    // LCP via PerformanceObserver entries already captured
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      const lcp = lcpEntries[lcpEntries.length - 1];
      newMetrics.push({ name: 'LCP', value: Math.round(lcp.startTime), rating: rateMetric('LCP', lcp.startTime) });
    }

    setMetrics(newMetrics);

    // Resources
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const grouped = resourceEntries
      .map(r => ({
        name: r.name.split('/').pop() || r.name,
        type: r.initiatorType,
        duration: Math.round(r.duration),
        size: r.transferSize || 0,
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20);
    setResources(grouped);

    // Memory
    const perfWithMemory = performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } };
    if (perfWithMemory.memory) {
      setMemoryUsage({
        used: Math.round(perfWithMemory.memory.usedJSHeapSize / 1048576),
        total: Math.round(perfWithMemory.memory.totalJSHeapSize / 1048576),
        limit: Math.round(perfWithMemory.memory.jsHeapSizeLimit / 1048576),
      });
    }
  }, []);

  // Capture JS errors
  useEffect(() => {
    const errorMap = new Map<string, ErrorEntry>();

    const handler = (event: ErrorEvent) => {
      const key = event.message;
      const existing = errorMap.get(key);
      if (existing) {
        existing.count++;
        existing.timestamp = new Date();
      } else {
        errorMap.set(key, {
          message: event.message,
          source: event.filename ? `${event.filename}:${event.lineno}` : 'unknown',
          timestamp: new Date(),
          count: 1,
        });
      }
      setErrors(Array.from(errorMap.values()).sort((a, b) => b.count - a.count));
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || String(event.reason);
      const key = msg;
      const existing = errorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        errorMap.set(key, {
          message: msg,
          source: 'unhandled promise rejection',
          timestamp: new Date(),
          count: 1,
        });
      }
      setErrors(Array.from(errorMap.values()).sort((a, b) => b.count - a.count));
    };

    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  // Collect on mount and periodically
  useEffect(() => {
    const timer = setTimeout(collectMetrics, 1000);
    const interval = setInterval(collectMetrics, 30000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [collectMetrics]);

  return { metrics, navigation, resources, errors, memoryUsage, refresh: collectMetrics };
}
