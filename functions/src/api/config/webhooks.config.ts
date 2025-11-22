/**
 * Webhook Configuration
 * Configuration for webhook events and delivery
 */

export const WEBHOOK_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeout: 10000, // 10 seconds
  events: [
    'project.created',
    'project.updated',
    'project.deleted',
    'project.approved',
    'project.rejected',
    'event.created',
    'event.updated',
    'event.deleted',
    'event.approved',
    'event.rejected',
    'application.submitted',
    'application.approved',
    'application.rejected',
    'registration.submitted',
    'registration.approved',
    'registration.rejected',
    'user.created',
    'user.updated',
    'user.deleted',
    'donation.received',
    'subscription.created',
    'subscription.updated',
  ] as const,
};

export type WebhookEvent = typeof WEBHOOK_CONFIG.events[number];

export default WEBHOOK_CONFIG;
