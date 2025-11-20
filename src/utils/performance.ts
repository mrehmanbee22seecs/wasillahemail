/**
 * Performance Monitoring and Optimization Utilities
 * 
 * Features:
 * - Performance metrics tracking
 * - Web Vitals monitoring
 * - Resource timing analysis
 * - Performance marks and measures
 * - Bundle analysis helpers
 * - Lazy loading utilities
 */

import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Web Vitals Types
export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

export interface PerformanceMetrics {
  // Navigation Timing
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  
  // Resource Timing
  totalResources: number;
  totalResourceSize: number;
  slowestResources: Array<{
    name: string;
    duration: number;
    size: number;
    type: string;
  }>;
  
  // Memory (if available)
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  
  // Page Info
  url: string;
  userAgent: string;
  timestamp: Date;
}

/**
 * Initialize Web Vitals monitoring
 */
export const initWebVitals = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals');

    const sendToAnalytics = (metric: WebVitalsMetric) => {
      // Send to Google Analytics if available
      if (window.gtag) {
        window.gtag('event', metric.name, {
          value: Math.round(metric.value),
          metric_rating: metric.rating,
          metric_delta: metric.delta,
          metric_id: metric.id,
        });
      }

      // Log poor performance metrics
      if (metric.rating === 'poor') {
        console.warn(`Poor ${metric.name} performance:`, metric);
        logPerformanceIssue(metric);
      }
    };

    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
};

/**
 * Collect comprehensive performance metrics
 */
export const collectPerformanceMetrics = (): PerformanceMetrics | null => {
  if (typeof window === 'undefined' || !window.performance) return null;

  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    // Navigation timing
    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
    const loadComplete = navigation.loadEventEnd - navigation.loadEventStart;

    // Paint timing
    const firstPaint = paint.find(p => p.name === 'first-paint')?.startTime || 0;
    const firstContentfulPaint = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;

    // Resource timing analysis
    const slowestResources = resources
      .map(r => ({
        name: r.name,
        duration: r.duration,
        size: r.transferSize || 0,
        type: r.initiatorType,
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const totalResourceSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

    // Memory usage (Chrome only)
    const memory = (performance as any).memory;

    return {
      domContentLoaded,
      loadComplete,
      firstPaint,
      firstContentfulPaint,
      totalResources: resources.length,
      totalResourceSize,
      slowestResources,
      memoryUsage: memory ? {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      } : undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Failed to collect performance metrics:', error);
    return null;
  }
};

/**
 * Log performance issue to Firestore
 */
const logPerformanceIssue = async (metric: WebVitalsMetric): Promise<void> => {
  try {
    await addDoc(collection(db, 'performance_issues'), {
      metricName: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      metricId: metric.id,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log performance issue:', error);
  }
};

/**
 * Create performance mark
 */
export const mark = (name: string): void => {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(name);
  }
};

/**
 * Measure performance between two marks
 */
export const measure = (name: string, startMark: string, endMark: string): number => {
  if (typeof window === 'undefined' || !window.performance) return 0;

  try {
    performance.measure(name, startMark, endMark);
    const measures = performance.getEntriesByName(name, 'measure');
    return measures[measures.length - 1]?.duration || 0;
  } catch (error) {
    console.error('Failed to measure performance:', error);
    return 0;
  }
};

/**
 * Clear performance marks and measures
 */
export const clearMarks = (name?: string): void => {
  if (typeof window !== 'undefined' && window.performance) {
    if (name) {
      performance.clearMarks(name);
      performance.clearMeasures(name);
    } else {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
};

/**
 * Lazy load component with retry logic
 */
export const lazyWithRetry = <T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> => {
  return React.lazy(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, interval * (i + 1)));
      }
    }
    throw new Error('Failed to load component after retries');
  });
};

/**
 * Preload critical resources
 */
export const preloadResource = (href: string, as: string, type?: string): void => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
};

/**
 * Prefetch resources for faster navigation
 */
export const prefetchResource = (href: string): void => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Optimize images with lazy loading
 */
export const optimizeImage = (src: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif';
}): string => {
  // If using Cloudinary or similar CDN, apply transformations
  if (src.includes('cloudinary.com')) {
    const transformations: string[] = [];
    
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.quality) transformations.push(`q_${options.quality}`);
    if (options?.format) transformations.push(`f_${options.format}`);
    
    const transform = transformations.join(',');
    return src.replace('/upload/', `/upload/${transform}/`);
  }
  
  return src;
};

/**
 * Debounce function for performance
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for performance
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Monitor long tasks (>50ms)
 */
export const monitorLongTasks = (): void => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn('Long task detected:', {
          duration: entry.duration,
          startTime: entry.startTime,
        });
        
        // Log to Firestore if duration > 100ms
        if (entry.duration > 100) {
          addDoc(collection(db, 'performance_issues'), {
            type: 'long_task',
            duration: entry.duration,
            startTime: entry.startTime,
            url: window.location.href,
            timestamp: serverTimestamp(),
          }).catch(console.error);
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.error('Failed to monitor long tasks:', error);
  }
};

/**
 * Get bundle size analysis
 */
export const analyzeBundleSize = (): void => {
  if (typeof window === 'undefined' || !window.performance) return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const scripts = resources.filter(r => r.initiatorType === 'script');
  const styles = resources.filter(r => r.initiatorType === 'css');
  const images = resources.filter(r => r.initiatorType === 'img');
  
  const analysis = {
    scripts: {
      count: scripts.length,
      totalSize: scripts.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      largest: scripts.sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))[0],
    },
    styles: {
      count: styles.length,
      totalSize: styles.reduce((sum, r) => sum + (r.transferSize || 0), 0),
    },
    images: {
      count: images.length,
      totalSize: images.reduce((sum, r) => sum + (r.transferSize || 0), 0),
    },
    total: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
  };
  
  console.table(analysis);
  return analysis;
};

// Type augmentation for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Re-export React for lazy loading
import React from 'react';
