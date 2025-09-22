/**
 * Bundle Analysis Utilities
 * Tools for analyzing and optimizing bundle size
 */

import React from 'react';

interface BundleStats {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    gzippedSize: number;
    modules: Array<{
      name: string;
      size: number;
      percentage: number;
    }>;
  }>;
  duplicates: Array<{
    module: string;
    chunks: string[];
    totalSize: number;
  }>;
  unusedExports: Array<{
    module: string;
    exports: string[];
  }>;
}

class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private stats: BundleStats | null = null;

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  // Analyze current bundle (in development)
  analyzeBundle(): BundleStats {
    if (this.stats) return this.stats;

    const stats: BundleStats = {
      totalSize: 0,
      gzippedSize: 0,
      chunks: [],
      duplicates: [],
      unusedExports: [],
    };

    // This would be populated by a webpack/vite bundle analyzer plugin
    // For now, we'll provide a mock structure
    console.log('Bundle analysis would be performed here in a real implementation');

    this.stats = stats;
    return stats;
  }

  // Get recommendations for bundle optimization
  getOptimizationRecommendations(): Array<{
    type: 'duplicate' | 'unused' | 'large' | 'splitting';
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestion: string;
  }> {
    const recommendations = [];

    // Check for large chunks
    if (this.stats) {
      this.stats.chunks.forEach(chunk => {
        if (chunk.size > 250000) { // 250KB
          recommendations.push({
            type: 'large',
            severity: 'high',
            message: `Chunk "${chunk.name}" is ${(chunk.size / 1024).toFixed(1)}KB`,
            suggestion: 'Consider splitting this chunk or lazy loading its content'
          });
        }
      });

      // Check for duplicates
      this.stats.duplicates.forEach(duplicate => {
        recommendations.push({
          type: 'duplicate',
          severity: 'medium',
          message: `Module "${duplicate.module}" is duplicated across ${duplicate.chunks.length} chunks`,
          suggestion: 'Move this module to a shared chunk or vendor bundle'
        });
      });

      // Check for unused exports
      this.stats.unusedExports.forEach(module => {
        if (module.exports.length > 5) {
          recommendations.push({
            type: 'unused',
            severity: 'low',
            message: `Module "${module.module}" has ${module.exports.length} unused exports`,
            suggestion: 'Remove unused exports to reduce bundle size'
          });
        }
      });
    }

    return recommendations;
  }

  // Generate bundle report
  generateReport(): string {
    const stats = this.analyzeBundle();
    const recommendations = this.getOptimizationRecommendations();

    let report = '# Bundle Analysis Report\n\n';
    
    report += `## Summary\n`;
    report += `- Total Size: ${(stats.totalSize / 1024).toFixed(1)}KB\n`;
    report += `- Gzipped Size: ${(stats.gzippedSize / 1024).toFixed(1)}KB\n`;
    report += `- Compression Ratio: ${((1 - stats.gzippedSize / stats.totalSize) * 100).toFixed(1)}%\n\n`;

    report += `## Chunks\n`;
    stats.chunks.forEach(chunk => {
      report += `- **${chunk.name}**: ${(chunk.size / 1024).toFixed(1)}KB (${(chunk.gzippedSize / 1024).toFixed(1)}KB gzipped)\n`;
    });

    if (recommendations.length > 0) {
      report += `\n## Optimization Recommendations\n`;
      recommendations.forEach(rec => {
        report += `- **${rec.severity.toUpperCase()}**: ${rec.message}\n`;
        report += `  - ${rec.suggestion}\n`;
      });
    }

    return report;
  }

  // Check if a module should be lazy loaded
  shouldLazyLoad(moduleName: string): boolean {
    const lazyLoadPatterns = [
      /pages\//,
      /components\/features\//,
      /charts\//,
      /analytics\//,
      /admin\//,
    ];

    return lazyLoadPatterns.some(pattern => pattern.test(moduleName));
  }

  // Get optimal chunk size for a module
  getOptimalChunkSize(moduleName: string): number {
    if (this.shouldLazyLoad(moduleName)) {
      return 100000; // 100KB for lazy loaded modules
    }
    return 250000; // 250KB for regular modules
  }

  // Track size for lazy loaded components
  trackSize(chunkName: string, size: number): void {
    bundleSizeMonitor.trackSize(chunkName, size);
  }

  // Get size history for lazy loaded components
  getSizeHistory(chunkName: string): any[] {
    return bundleSizeMonitor.getSizeHistory(chunkName);
  }
}

export const bundleAnalyzer = BundleAnalyzer.getInstance();

// Bundle size monitoring
export const bundleSizeMonitor = {
  // Track bundle size over time
  trackSize: (chunkName: string, size: number) => {
    const data = {
      chunk: chunkName,
      size,
      timestamp: Date.now(),
    };
    
    // Store in localStorage for persistence
    try {
      const existing = JSON.parse(localStorage.getItem('bundle-sizes') || '[]');
      existing.push(data);
      
      // Keep only last 100 entries
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }
      
      localStorage.setItem('bundle-sizes', JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to track bundle size:', error);
    }
  },

  // Get size history for a chunk
  getSizeHistory: (chunkName: string) => {
    try {
      const data = JSON.parse(localStorage.getItem('bundle-sizes') || '[]');
      return data.filter((entry: any) => entry.chunk === chunkName);
    } catch (error) {
      console.warn('Failed to get bundle size history:', error);
      return [];
    }
  },

  // Get size trend for a chunk
  getSizeTrend: (chunkName: string) => {
    const history = bundleSizeMonitor.getSizeHistory(chunkName);
    if (history.length < 2) return 'stable';

    const recent = history.slice(-5);
    const trend = recent.reduce((acc, curr, index) => {
      if (index === 0) return 0;
      return acc + (curr.size - recent[index - 1].size);
    }, 0) / (recent.length - 1);

    if (trend > 1000) return 'increasing';
    if (trend < -1000) return 'decreasing';
    return 'stable';
  },
};

// Dynamic import utilities
export const dynamicImports = {
  // Lazy load a component with error boundary
  lazy: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) => {
    return React.lazy(importFn);
  },

  // Lazy load with preloading
  lazyWithPreload: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    preloadTrigger?: () => boolean
  ) => {
    const LazyComponent = React.lazy(importFn);
    
    // Preload on trigger
    if (preloadTrigger) {
      const checkPreload = () => {
        if (preloadTrigger()) {
          importFn();
        }
      };
      
      // Check on mouse hover, focus, etc.
      document.addEventListener('mouseover', checkPreload);
      document.addEventListener('focusin', checkPreload);
    }

    return LazyComponent;
  },

  // Lazy load with retry
  lazyWithRetry: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    maxRetries = 3
  ) => {
    return React.lazy(() => {
      const retry = (attempt: number): Promise<{ default: T }> => {
        return importFn().catch((error) => {
          if (attempt < maxRetries) {
            console.warn(`Failed to load component, retrying... (${attempt + 1}/${maxRetries})`);
            return new Promise((resolve) => {
              setTimeout(() => resolve(retry(attempt + 1)), 1000 * attempt);
            });
          }
          throw error;
        });
      };
      
      return retry(0);
    });
  },
};

// Code splitting utilities
export const codeSplitting = {
  // Split by route
  splitByRoute: (routes: string[]) => {
    return routes.reduce((acc, route) => {
      acc[route] = () => import(`../pages/${route}.tsx`);
      return acc;
    }, {} as Record<string, () => Promise<any>>);
  },

  // Split by feature
  splitByFeature: (features: string[]) => {
    return features.reduce((acc, feature) => {
      acc[feature] = () => import(`../components/features/${feature}/index.tsx`);
      return acc;
    }, {} as Record<string, () => Promise<any>>);
  },

  // Split vendor libraries
  splitVendors: () => {
    return {
      react: () => import('react'),
      'react-dom': () => import('react-dom'),
      'react-router-dom': () => import('react-router-dom'),
      '@tanstack/react-query': () => import('@tanstack/react-query'),
      'react-i18next': () => import('react-i18next'),
      axios: () => import('axios'),
      zustand: () => import('zustand'),
    };
  },
};

export default bundleAnalyzer;
