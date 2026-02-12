'use client';

import { useReportWebVitals } from 'next/web-vitals';
import * as Sentry from '@sentry/nextjs';
import { trackEvent } from './google-analytics';

/**
 * Web Vitals tracking component
 * Captures Core Web Vitals metrics and sends them to analytics services
 *
 * Metrics tracked:
 * - FCP (First Contentful Paint) - Target: < 1.5s
 * - LCP (Largest Contentful Paint) - Target: < 2.5s
 * - CLS (Cumulative Layout Shift) - Target: < 0.1
 * - FID (First Input Delay) - Target: < 100ms
 * - TTFB (Time to First Byte) - Target: < 600ms
 * - INP (Interaction to Next Paint) - Target: < 200ms
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    // Determine if the metric value is good, needs improvement, or poor
    const getRating = (): 'good' | 'needs-improvement' | 'poor' => {
      switch (metric.name) {
        case 'FCP':
          if (metric.value < 1800) return 'good';
          if (metric.value < 3000) return 'needs-improvement';
          return 'poor';
        case 'LCP':
          if (metric.value < 2500) return 'good';
          if (metric.value < 4000) return 'needs-improvement';
          return 'poor';
        case 'CLS':
          if (metric.value < 0.1) return 'good';
          if (metric.value < 0.25) return 'needs-improvement';
          return 'poor';
        case 'FID':
          if (metric.value < 100) return 'good';
          if (metric.value < 300) return 'needs-improvement';
          return 'poor';
        case 'TTFB':
          if (metric.value < 800) return 'good';
          if (metric.value < 1800) return 'needs-improvement';
          return 'poor';
        case 'INP':
          if (metric.value < 200) return 'good';
          if (metric.value < 500) return 'needs-improvement';
          return 'poor';
        default:
          return 'good';
      }
    };

    const rating = getRating();

    // Send to Google Analytics
    trackEvent(
      'web_vitals',
      'Performance',
      metric.name,
      Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value)
    );

    // Send to Sentry for performance monitoring
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.addBreadcrumb({
        category: 'web-vitals',
        message: `${metric.name}: ${metric.value}`,
        level: rating === 'poor' ? 'warning' : 'info',
        data: {
          metric: metric.name,
          value: metric.value,
          rating,
          id: metric.id,
          navigationType: metric.navigationType,
        },
      });

      // Report poor metrics as transactions for tracking
      if (rating === 'poor') {
        Sentry.captureMessage(`Poor ${metric.name} performance: ${metric.value}`, {
          level: 'warning',
          tags: {
            metric: metric.name,
            rating,
          },
          extra: {
            value: metric.value,
            navigationType: metric.navigationType,
          },
        });
      }
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating,
        navigationType: metric.navigationType,
      });
    }
  });

  return null;
}
