import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

export const initSentry = () => {
  if (!SENTRY_DSN || ENVIRONMENT === 'development') {
    console.log('Sentry disabled in development mode');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    integrations: [
      new ProfilingIntegration(),
    ],
    
    // Performance Monitoring
    tracesSampleRate: 1.0,
    
    // Profiling
    profilesSampleRate: 1.0,
    
    // Release tracking
    release: `wasilah-backend@${process.env.APP_VERSION || '1.0.0'}`,
  });
  
  console.log('Sentry initialized for backend');
};

// Express error handler middleware
export const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler();
};

// Express request handler middleware
export const sentryRequestHandler = () => {
  return Sentry.Handlers.requestHandler();
};

// Express tracing middleware
export const sentryTracingHandler = () => {
  return Sentry.Handlers.tracingHandler();
};

// Helper to capture custom errors
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('custom', context);
    }
    Sentry.captureException(error);
  });
};

// Helper to capture custom messages
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// Helper to set user context
export const setUserContext = (user: { id: string; email?: string; role?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};

export default Sentry;
