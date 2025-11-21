import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export const initSentry = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: `wasilah@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
      
      integrations: [
        new BrowserTracing({
          tracePropagationTargets: ['localhost', /^\//],
        }),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],

      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Error filtering
      beforeSend(event, hint) {
        // Don't send errors in development
        if (import.meta.env.DEV) {
          return null;
        }

        // Filter out known non-critical errors
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message).toLowerCase();
          if (
            message.includes('resizeobserver') ||
            message.includes('non-error promise rejection')
          ) {
            return null;
          }
        }

        return event;
      },

      // Custom tags
      initialScope: {
        tags: {
          app_section: 'frontend',
        },
      },
    });
  }
};

/**
 * Set user context for Sentry
 */
export const setSentryUser = (user: { id: string; email?: string; role?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};

/**
 * Clear user context on logout
 */
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

/**
 * Capture custom exception
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capture custom message
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (message: string, category?: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    data,
    level: 'info',
  });
};
