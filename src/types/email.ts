/**
 * Email Automation & Workflows Type Definitions
 * Comprehensive types for email templates, campaigns, workflows, and subscribers
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export type TemplateCategory = 'welcome' | 'transactional' | 'marketing' | 'system';

export type TemplateVariable = 
  | '{{name}}'
  | '{{email}}'
  | '{{projectTitle}}'
  | '{{eventTitle}}'
  | '{{link}}'
  | '{{date}}'
  | '{{time}}'
  | '{{status}}'
  | '{{message}}'
  | '{{organizationName}}';

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: TemplateVariable[];
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  usageCount: number;
  tags: string[];
}

export interface TemplatePreview {
  subject: string;
  htmlContent: string;
  textContent: string;
  sampleData: Record<string, string>;
}

// ============================================================================
// EMAIL CAMPAIGNS
// ============================================================================

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';

export type RecipientSegment = 
  | 'all_users'
  | 'students'
  | 'volunteers'
  | 'ngos'
  | 'admins'
  | 'active_users'
  | 'inactive_users'
  | 'premium_users'
  | 'free_users'
  | 'custom';

export interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  templateId: string;
  subject: string;
  recipientSegment: RecipientSegment;
  recipientEmails?: string[]; // for custom segment
  recipientCount: number;
  status: CampaignStatus;
  scheduledFor?: Timestamp;
  sentAt?: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Analytics
  analytics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    failed: number;
  };
  
  // Settings
  settings: {
    trackOpens: boolean;
    trackClicks: boolean;
    includeUnsubscribe: boolean;
    replyToEmail?: string;
  };
}

export interface CampaignDraft {
  name: string;
  description: string;
  templateId: string;
  subject: string;
  recipientSegment: RecipientSegment;
  recipientEmails?: string[];
  scheduledFor?: Date;
  settings: {
    trackOpens: boolean;
    trackClicks: boolean;
    includeUnsubscribe: boolean;
    replyToEmail?: string;
  };
}

// ============================================================================
// EMAIL WORKFLOWS
// ============================================================================

export type WorkflowTrigger = 
  | 'user_signup'
  | 'project_submission'
  | 'project_approval'
  | 'project_rejection'
  | 'event_registration'
  | 'event_reminder'
  | 'achievement_earned'
  | 'weekly_digest'
  | 'subscription_upgrade'
  | 'subscription_downgrade';

export type WorkflowActionType = 'send_email' | 'wait' | 'condition' | 'update_status';

export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  config: {
    templateId?: string; // for send_email
    delayInHours?: number; // for wait
    condition?: string; // for condition
    statusUpdate?: string; // for update_status
  };
  nextActionId?: string;
}

export interface EmailWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  isActive: boolean;
  actions: WorkflowAction[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Statistics
  stats: {
    triggered: number;
    completed: number;
    failed: number;
  };
}

// ============================================================================
// EMAIL SUBSCRIBERS
// ============================================================================

export type SubscriberStatus = 'subscribed' | 'unsubscribed' | 'bounced' | 'complained';

export interface EmailSubscriber {
  id: string;
  userId?: string; // linked to user account if registered
  email: string;
  name?: string;
  status: SubscriberStatus;
  segments: RecipientSegment[];
  subscribedAt: Timestamp;
  unsubscribedAt?: Timestamp;
  
  // Preferences
  preferences: {
    newsletters: boolean;
    productUpdates: boolean;
    projectNotifications: boolean;
    eventReminders: boolean;
    achievements: boolean;
    weeklyDigest: boolean;
  };
  
  // Engagement metrics
  metrics: {
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    lastOpenedAt?: Timestamp;
    lastClickedAt?: Timestamp;
  };
}

// ============================================================================
// EMAIL SENDING
// ============================================================================

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  contentType: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

// ============================================================================
// EMAIL LOGS
// ============================================================================

export type EmailEventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed';

export interface EmailLog {
  id: string;
  campaignId?: string;
  workflowId?: string;
  recipientEmail: string;
  recipientUserId?: string;
  templateId: string;
  subject: string;
  eventType: EmailEventType;
  eventTimestamp: Timestamp;
  messageId?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// EMAIL ANALYTICS
// ============================================================================

export interface EmailAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  
  // Rates
  deliveryRate: number; // delivered / sent
  openRate: number; // opened / delivered
  clickRate: number; // clicked / delivered
  bounceRate: number; // bounced / sent
  unsubscribeRate: number; // unsubscribed / delivered
  
  // Time series data
  dailyStats: {
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }[];
}

// ============================================================================
// AUTOMATED SEQUENCES
// ============================================================================

export interface WelcomeSequence {
  email1: { delay: 0; template: string }; // immediate
  email2: { delay: 72; template: string }; // after 3 days
  email3: { delay: 168; template: string }; // after 7 days
}

export interface EventReminderSequence {
  reminder7days: { delay: -168; template: string }; // 7 days before
  reminder24hours: { delay: -24; template: string }; // 24 hours before
  reminder1hour: { delay: -1; template: string }; // 1 hour before
  followup: { delay: 24; template: string }; // day after
}

export interface ProjectUpdateSequence {
  submission: { delay: 0; template: string }; // immediate
  underReview: { delay: 24; template: string }; // after 1 day
  approval: { delay: 0; template: string }; // immediate when approved
  rejection: { delay: 0; template: string }; // immediate when rejected
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface TemplateRenderData {
  name?: string;
  email?: string;
  projectTitle?: string;
  eventTitle?: string;
  link?: string;
  date?: string;
  time?: string;
  status?: string;
  message?: string;
  organizationName?: string;
  [key: string]: string | undefined;
}

export interface CampaignFilters {
  status?: CampaignStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  createdBy?: string;
}

export interface SubscriberFilters {
  status?: SubscriberStatus[];
  segments?: RecipientSegment[];
  searchQuery?: string;
}
