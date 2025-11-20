/**
 * Monitoring Service for Application Health and Performance
 * 
 * Features:
 * - Error tracking and logging
 * - Performance monitoring
 * - Usage analytics
 * - Cost monitoring
 * - Health checks
 * - Alert notifications
 */

import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import type { WebVitalsMetric } from '../utils/performance';

export interface ErrorLog {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface PerformanceLog {
  metricName: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  url: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface UsageLog {
  eventName: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

export interface CostMetrics {
  period: 'daily' | 'weekly' | 'monthly';
  firestoreReads: number;
  firestoreWrites: number;
  firestoreDeletes: number;
  storageBytes: number;
  functionsInvocations: number;
  estimatedCost: number;
  timestamp: Date;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    name: string;
    status: 'pass' | 'fail';
    message?: string;
    duration: number;
  }[];
  timestamp: Date;
}

class MonitoringService {
  private errorBuffer: ErrorLog[] = [];
  private performanceBuffer: PerformanceLog[] = [];
  private usageBuffer: UsageLog[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private maxBufferSize: number = 50;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushTimer();
    this.setupGlobalErrorHandler();
    this.setupUnhandledRejectionHandler();
  }

  /**
   * Log application error
   */
  logError(error: Error | string, context?: Record<string, any>, severity: ErrorLog['severity'] = 'medium'): void {
    const errorLog: ErrorLog = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' && error.stack ? error.stack : undefined,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date(),
      severity,
      context,
    };

    this.errorBuffer.push(errorLog);

    // Log critical errors immediately
    if (severity === 'critical') {
      this.flushErrors();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog);
    }

    // Check buffer size
    if (this.errorBuffer.length >= this.maxBufferSize) {
      this.flushErrors();
    }
  }

  /**
   * Log performance metric
   */
  logPerformance(metricName: string, value: number, rating?: PerformanceLog['rating'], context?: Record<string, any>): void {
    const perfLog: PerformanceLog = {
      metricName,
      value,
      rating,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date(),
      context,
    };

    this.performanceBuffer.push(perfLog);

    if (this.performanceBuffer.length >= this.maxBufferSize) {
      this.flushPerformance();
    }
  }

  /**
   * Log usage event
   */
  logUsage(eventName: string, properties?: Record<string, any>, userId?: string): void {
    const usageLog: UsageLog = {
      eventName,
      userId,
      properties,
      timestamp: new Date(),
    };

    this.usageBuffer.push(usageLog);

    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, properties);
    }

    if (this.usageBuffer.length >= this.maxBufferSize) {
      this.flushUsage();
    }
  }

  /**
   * Flush error logs to Firestore
   */
  private async flushErrors(): Promise<void> {
    if (this.errorBuffer.length === 0) return;

    const errors = [...this.errorBuffer];
    this.errorBuffer = [];

    try {
      const promises = errors.map(error =>
        addDoc(collection(db, 'error_logs'), {
          ...error,
          timestamp: serverTimestamp(),
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to flush error logs:', error);
      // Re-add to buffer if failed
      this.errorBuffer.push(...errors);
    }
  }

  /**
   * Flush performance logs to Firestore
   */
  private async flushPerformance(): Promise<void> {
    if (this.performanceBuffer.length === 0) return;

    const metrics = [...this.performanceBuffer];
    this.performanceBuffer = [];

    try {
      const promises = metrics.map(metric =>
        addDoc(collection(db, 'performance_logs'), {
          ...metric,
          timestamp: serverTimestamp(),
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to flush performance logs:', error);
    }
  }

  /**
   * Flush usage logs to Firestore
   */
  private async flushUsage(): Promise<void> {
    if (this.usageBuffer.length === 0) return;

    const events = [...this.usageBuffer];
    this.usageBuffer = [];

    try {
      const promises = events.map(event =>
        addDoc(collection(db, 'usage_logs'), {
          ...event,
          timestamp: serverTimestamp(),
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to flush usage logs:', error);
    }
  }

  /**
   * Flush all buffers
   */
  async flushAll(): Promise<void> {
    await Promise.all([
      this.flushErrors(),
      this.flushPerformance(),
      this.flushUsage(),
    ]);
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushAll().catch(console.error);
    }, this.flushInterval);
  }

  /**
   * Stop flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Setup global error handler
   */
  private setupGlobalErrorHandler(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.logError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }, 'high');
    });
  }

  /**
   * Setup unhandled promise rejection handler
   */
  private setupUnhandledRejectionHandler(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, {
        promise: event.promise.toString(),
      }, 'high');
    });
  }

  /**
   * Perform health checks
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = [];

    // Check Firestore connectivity
    const firestoreCheck = await this.checkFirestore();
    checks.push(firestoreCheck);

    // Check browser storage
    const storageCheck = this.checkStorage();
    checks.push(storageCheck);

    // Check memory usage
    const memoryCheck = this.checkMemory();
    checks.push(memoryCheck);

    // Determine overall status
    const hasFailures = checks.some(c => c.status === 'fail');
    const status: HealthCheckResult['status'] = hasFailures ? 'unhealthy' : 'healthy';

    return {
      status,
      checks,
      timestamp: new Date(),
    };
  }

  /**
   * Check Firestore connectivity
   */
  private async checkFirestore(): Promise<HealthCheckResult['checks'][0]> {
    const startTime = Date.now();
    
    try {
      // Simple query to check connectivity
      const q = query(collection(db, 'health_checks'), limit(1));
      await getDocs(q);
      
      return {
        name: 'firestore',
        status: 'pass',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name: 'firestore',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Check browser storage availability
   */
  private checkStorage(): HealthCheckResult['checks'][0] {
    const startTime = Date.now();
    
    try {
      const test = 'storage_test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      
      return {
        name: 'storage',
        status: 'pass',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name: 'storage',
        status: 'fail',
        message: 'localStorage not available',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): HealthCheckResult['checks'][0] {
    const startTime = Date.now();
    
    if (typeof performance === 'undefined' || !(performance as any).memory) {
      return {
        name: 'memory',
        status: 'pass',
        message: 'Memory API not available',
        duration: Date.now() - startTime,
      };
    }

    try {
      const memory = (performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (usagePercent > 90) {
        return {
          name: 'memory',
          status: 'fail',
          message: `High memory usage: ${usagePercent.toFixed(2)}%`,
          duration: Date.now() - startTime,
        };
      }
      
      return {
        name: 'memory',
        status: 'pass',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(days: number = 7): Promise<{
    total: number;
    bySeverity: Record<ErrorLog['severity'], number>;
    byUrl: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
      collection(db, 'error_logs'),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const errors = snapshot.docs.map(doc => doc.data() as ErrorLog);

    const bySeverity: Record<ErrorLog['severity'], number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const byUrl: Record<string, number> = {};

    errors.forEach(error => {
      bySeverity[error.severity]++;
      byUrl[error.url] = (byUrl[error.url] || 0) + 1;
    });

    return {
      total: errors.length,
      bySeverity,
      byUrl,
    };
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(days: number = 7): Promise<{
    averages: Record<string, number>;
    poorCount: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
      collection(db, 'performance_logs'),
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    );

    const snapshot = await getDocs(q);
    const metrics = snapshot.docs.map(doc => doc.data() as PerformanceLog);

    const averages: Record<string, number> = {};
    const counts: Record<string, number> = {};
    let poorCount = 0;

    metrics.forEach(metric => {
      averages[metric.metricName] = (averages[metric.metricName] || 0) + metric.value;
      counts[metric.metricName] = (counts[metric.metricName] || 0) + 1;
      
      if (metric.rating === 'poor') {
        poorCount++;
      }
    });

    Object.keys(averages).forEach(key => {
      averages[key] = averages[key] / counts[key];
    });

    return {
      averages,
      poorCount,
    };
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

// Export convenience methods
export const logError = (error: Error | string, context?: Record<string, any>, severity?: ErrorLog['severity']) =>
  monitoringService.logError(error, context, severity);

export const logPerformance = (metricName: string, value: number, rating?: PerformanceLog['rating'], context?: Record<string, any>) =>
  monitoringService.logPerformance(metricName, value, rating, context);

export const logUsage = (eventName: string, properties?: Record<string, any>, userId?: string) =>
  monitoringService.logUsage(eventName, properties, userId);

export const performHealthCheck = () =>
  monitoringService.performHealthCheck();

// Type augmentation
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
