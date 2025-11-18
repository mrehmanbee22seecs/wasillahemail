import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

type TemplateName =
  | 'verification'
  | 'welcome'
  | 'forgot-password'
  | 'project-submission'
  | 'project-approval'
  | 'reminder'
  | 'volunteer-confirmation'
  | 'edit-request-submitted'
  | 'edit-request-status'
  | 'notification';

type CallableData = {
  template: TemplateName;
  email?: string;
  name?: string;
  role?: string;
  projectName?: string;
  submissionType?: 'project' | 'event';
  message?: string;
  link?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  submissionTitle?: string;
  status?: 'approved' | 'rejected';
  rejectionReason?: string;
};

type EmailResult = {
  success: boolean;
  error?: string;
  errorCode?: string;
};

const callable = httpsCallable<CallableData, { success: boolean; template?: string; messageId?: string }>(
  functions,
  'sendTransactionalEmail'
);

/**
 * Maps Firebase error codes to human-readable messages
 */
function getHumanReadableError(error: any): string {
  if (!error) return 'An unknown error occurred while sending email';

  const code = error.code || '';
  const message = error.message || '';

  // Firebase Functions error codes
  if (code === 'resource-exhausted') {
    return 'Email limit exceeded. Please try again in an hour.';
  }
  if (code === 'permission-denied') {
    return 'You do not have permission to send this email.';
  }
  if (code === 'unauthenticated') {
    return 'Please sign in to send this email.';
  }
  if (code === 'invalid-argument') {
    return message || 'Invalid email request. Please check your information and try again.';
  }
  if (code === 'internal') {
    return 'Email service temporarily unavailable. Please try again later.';
  }
  if (code === 'unavailable') {
    return 'Email service is temporarily unavailable. Please try again in a few moments.';
  }

  // Check message for common patterns
  if (message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('quota')) {
    return 'Email limit exceeded. Please try again in an hour.';
  }
  if (message.toLowerCase().includes('throttle') || message.toLowerCase().includes('limit')) {
    return 'Too many requests. Please wait before trying again.';
  }

  // Return original message if it's user-friendly, otherwise generic
  return message && message.length < 100 ? message : 'Failed to send email. Please try again later.';
}

async function triggerEmail(payload: CallableData): Promise<EmailResult> {
  try {
    const result = await callable(payload);
    return {
      success: !!result.data?.success,
    };
  } catch (error: any) {
    console.error('Failed to invoke transactional email function', error);
    
    const errorMessage = getHumanReadableError(error);
    const errorCode = error?.code || 'unknown';
    
    return {
      success: false,
      error: errorMessage,
      errorCode,
    };
  }
}

export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  role?: 'student' | 'ngo' | 'volunteer' | 'admin';
}): Promise<EmailResult> {
  return triggerEmail({
    template: 'welcome',
    email: params.email,
    name: params.name,
    role: params.role,
  });
}

export async function sendSubmissionConfirmation(params: {
  email: string;
  name: string;
  projectName: string;
  type: 'project' | 'event';
}): Promise<EmailResult> {
  return triggerEmail({
    template: 'project-submission',
    email: params.email,
    name: params.name,
    projectName: params.projectName,
    submissionType: params.type,
  });
}

export async function sendApprovalEmail(params: {
  email: string;
  name: string;
  projectName: string;
  type: 'project' | 'event';
}): Promise<EmailResult> {
  return triggerEmail({
    template: 'project-approval',
    email: params.email,
    name: params.name,
    projectName: params.projectName,
    submissionType: params.type,
  });
}

export async function sendReminderEmail(params: {
  email: string;
  name: string;
  projectName: string;
  message: string;
}): Promise<EmailResult> {
  return triggerEmail({
    template: 'reminder',
    email: params.email,
    name: params.name,
    projectName: params.projectName,
    message: params.message,
  });
}

export async function sendVolunteerConfirmation(params: {
  email: string;
  name: string;
}): Promise<EmailResult> {
  return triggerEmail({
    template: 'volunteer-confirmation',
    email: params.email,
    name: params.name,
  });
}

export async function sendEditRequestEmail(params: {
  email: string;
  name: string;
  submissionTitle: string;
  type: 'project' | 'event';
}): Promise<EmailResult> {
  return triggerEmail({
    template: 'edit-request-submitted',
    email: params.email,
    name: params.name,
    submissionTitle: params.submissionTitle,
    submissionType: params.type,
  });
}

export async function sendEditRequestStatusEmail(params: {
  email: string;
  name: string;
  submissionTitle: string;
  type: 'project' | 'event';
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}): Promise<EmailResult> {
  return triggerEmail({
    template: 'edit-request-status',
    email: params.email,
    name: params.name,
    submissionTitle: params.submissionTitle,
    submissionType: params.type,
    status: params.status,
    rejectionReason: params.rejectionReason,
  });
}

export async function sendNotificationTemplate(params: {
  email: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): Promise<EmailResult> {
  return triggerEmail({
    template: 'notification',
    email: params.email,
    title: params.title,
    body: params.body,
    ctaLabel: params.ctaLabel,
    ctaUrl: params.ctaUrl,
  });
}

// Export type for use in components
export type { EmailResult };

export default {
  sendWelcomeEmail,
  sendSubmissionConfirmation,
  sendApprovalEmail,
  sendReminderEmail,
  sendVolunteerConfirmation,
  sendEditRequestEmail,
  sendEditRequestStatusEmail,
  sendNotificationTemplate,
};
