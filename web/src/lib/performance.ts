// Performance monitoring utility for tracking loading times

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success?: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeOperations: Map<string, PerformanceMetric> = new Map();

  startOperation(operation: string, metadata?: Record<string, any>): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      operation,
      startTime: performance.now(),
      metadata
    };
    
    this.activeOperations.set(id, metric);
    return id;
  }

  endOperation(id: string, success: boolean = true, error?: string): PerformanceMetric | null {
    const metric = this.activeOperations.get(id);
    if (!metric) return null;

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    if (error) metric.error = error;

    this.metrics.push(metric);
    this.activeOperations.delete(id);

    // Log slow operations
    if (metric.duration > 5000) { // 5 seconds
      console.warn(`Slow operation detected: ${metric.operation} took ${metric.duration.toFixed(2)}ms`, metric);
    }

    return metric;
  }

  getMetrics(operation?: string): PerformanceMetric[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return [...this.metrics];
  }

  getAverageDuration(operation: string): number {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) return 0;
    
    const totalDuration = operationMetrics.reduce((sum, metric) => sum + (metric.duration || 0), 0);
    return totalDuration / operationMetrics.length;
  }

  clearMetrics(): void {
    this.metrics = [];
    this.activeOperations.clear();
  }

  generateReport(): string {
    const operations = new Set(this.metrics.map(m => m.operation));
    let report = 'Performance Report:\n';
    
    operations.forEach(operation => {
      const operationMetrics = this.getMetrics(operation);
      const avgDuration = this.getAverageDuration(operation);
      const successCount = operationMetrics.filter(m => m.success).length;
      const totalCount = operationMetrics.length;
      const successRate = totalCount > 0 ? (successCount / totalCount * 100).toFixed(1) : '0';
      
      report += `\n${operation}:\n`;
      report += `  Average duration: ${avgDuration.toFixed(2)}ms\n`;
      report += `  Success rate: ${successRate}% (${successCount}/${totalCount})\n`;
      report += `  Total calls: ${totalCount}\n`;
    });
    
    return report;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common operations
export const trackOperation = async <T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const id = performanceMonitor.startOperation(operation, metadata);
  
  try {
    const result = await fn();
    performanceMonitor.endOperation(id, true);
    return result;
  } catch (error) {
    performanceMonitor.endOperation(id, false, error instanceof Error ? error.message : String(error));
    throw error;
  }
};

// Hook for React components to track performance
export const usePerformanceTracking = () => {
  return {
    trackOperation,
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getAverageDuration: performanceMonitor.getAverageDuration.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
    clearMetrics: performanceMonitor.clearMetrics.bind(performanceMonitor)
  };
};

// Auto-log performance report on page unload (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('beforeunload', () => {
    const report = performanceMonitor.generateReport();
    console.log(report);
  });
}
