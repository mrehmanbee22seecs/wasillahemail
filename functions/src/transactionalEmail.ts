
import * as functions from 'firebase-functions';
import { logger } from 'firebase-functions';
import { createHash } from 'crypto';
import { admin } from './firebase';
import { getAppUrl } from './config';
import { sendEmail } from './resend';
import { buildEmailTemplate, TemplateInput, TemplateName } from './emailTemplates';
import { enforceRateLimit } from './rateLimiter';

type CallableData = Partial<TemplateInput> & {
  template?: TemplateName;
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
  rejectionReason?: string;
  status?: 'approved' | 'rejected';
};

const RUN_OPTIONS: functions.RuntimeOptions = {
  timeoutSeconds: 30,
  memory: '256MB',
  minInstances: 0,
};

const UNAUTH_TEMPLATES: TemplateName[] = ['verification', 'forgot-password'];

function hashIdentifier(value: string): string {
  return createHash('sha256').update(value.toLowerCase()).digest('hex');
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new functions.https.HttpsError('invalid-argument', `${field} is required`);
  }
  return value.trim();
}

async function buildTemplateInput(
  template: TemplateName,
  data: CallableData,
  email: string,
  context: functions.https.CallableContext
): Promise<TemplateInput> {
  switch (template) {
    case 'verification': {
      const appUrl = data.link || `${getAppUrl()}/dashboard`;
      const link = await admin.auth().generateEmailVerificationLink(email, {
        url: appUrl,
        handleCodeInApp: true,
      });
      return { type: 'verification', link, name: data.name || context.auth?.token?.name };
    }
    case 'forgot-password': {
      const appUrl = data.link || `${getAppUrl()}/dashboard`;
      const link = await admin.auth().generatePasswordResetLink(email, {
        url: appUrl,
        handleCodeInApp: true,
      });
      return { type: 'forgot-password', link, name: data.name || context.auth?.token?.name };
    }
    case 'welcome':
      return {
        type: 'welcome',
        name: requireString(data.name || context.auth?.token?.name || 'Friend', 'name'),
        role: (data.role as string) || (context.auth?.token?.role as string) || 'volunteer',
      };
    case 'project-submission':
    case 'project-approval':
      return {
        type: template,
        name: requireString(data.name || context.auth?.token?.name || 'Friend', 'name'),
        projectName: requireString(data.projectName, 'projectName'),
        submissionType: (data.submissionType as 'project' | 'event') || 'project',
      } as TemplateInput;
    case 'reminder':
      return {
        type: 'reminder',
        name: requireString(data.name || context.auth?.token?.name || 'Friend', 'name'),
        projectName: requireString(data.projectName, 'projectName'),
        message: requireString(data.message, 'message'),
      };
    case 'volunteer-confirmation':
      return {
        type: 'volunteer-confirmation',
        name: requireString(data.name || context.auth?.token?.name || 'Friend', 'name'),
      };
    case 'edit-request-submitted':
      return {
        type: 'edit-request-submitted',
        name: requireString(data.name || context.auth?.token?.name || 'Friend', 'name'),
        submissionTitle: requireString(data.submissionTitle, 'submissionTitle'),
        submissionType: (data.submissionType as 'project' | 'event') || 'project',
      };
    case 'edit-request-status':
      return {
        type: 'edit-request-status',
        name: requireString(data.name || context.auth?.token?.name || 'Friend', 'name'),
        submissionTitle: requireString(data.submissionTitle, 'submissionTitle'),
        submissionType: (data.submissionType as 'project' | 'event') || 'project',
        status: (data.status as 'approved' | 'rejected') || 'approved',
        rejectionReason: data.rejectionReason,
      };
    case 'notification':
      return {
        type: 'notification',
        title: requireString(data.title, 'title'),
        body: requireString(data.body, 'body'),
        ctaLabel: data.ctaLabel,
        ctaUrl: data.ctaUrl,
      };
    default:
      throw new functions.https.HttpsError('invalid-argument', `Unsupported template ${template}`);
  }
}

export const sendTransactionalEmail = functions
  .runWith(RUN_OPTIONS)
  .https.onCall(async (data: CallableData, context) => {
    const startTime = Date.now();
    const template = data?.template as TemplateName | undefined;

    logger.info('sendTransactionalEmail called', {
      template,
      hasAuth: !!context.auth,
      authUid: context.auth?.uid,
      requestEmail: data.email,
    });

    if (!template) {
      logger.warn('sendTransactionalEmail: template missing');
      throw new functions.https.HttpsError('invalid-argument', 'template is required');
    }

    // Auth check: require auth for all templates except verification and forgot-password
    if (!context.auth && !UNAUTH_TEMPLATES.includes(template)) {
      logger.warn('sendTransactionalEmail: unauthenticated request for protected template', {
        template,
      });
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required to send this email'
      );
    }

    const authEmail = context.auth?.token?.email as string | undefined;
    const targetEmail = data.email || authEmail;

    if (!targetEmail) {
      logger.warn('sendTransactionalEmail: email missing');
      throw new functions.https.HttpsError('invalid-argument', 'email is required');
    }

    // For authenticated users, email must match their auth email
    if (context.auth && data.email && data.email !== authEmail) {
      logger.warn('sendTransactionalEmail: email mismatch for authenticated user', {
        authEmail,
        requestedEmail: data.email,
        uid: context.auth.uid,
      });
      throw new functions.https.HttpsError(
        'permission-denied',
        'Email does not match authenticated user'
      );
    }

    // For unauthenticated verification requests, verify email matches request body to prevent abuse
    if (!context.auth && template === 'verification') {
      if (!data.email || data.email !== targetEmail) {
        logger.warn('sendTransactionalEmail: verification email mismatch for unauthenticated request', {
          requestedEmail: data.email,
          targetEmail,
        });
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Email verification requires email parameter to match request'
        );
      }
    }

    // Rate limiting: per-user or per-email
    const throttleKey = context.auth?.uid
      ? `uid:${context.auth.uid}`
      : `email:${hashIdentifier(targetEmail)}`;

    try {
      await enforceRateLimit(throttleKey, {
        metadata: { template, email: targetEmail },
      });
      logger.info('sendTransactionalEmail: rate limit check passed', {
        throttleKey: throttleKey.substring(0, 20) + '...', // Partial key for logging
        template,
      });
    } catch (error) {
      if (error instanceof functions.https.HttpsError && error.code === 'resource-exhausted') {
        logger.warn('sendTransactionalEmail: rate limit exceeded', {
          throttleKey: throttleKey.substring(0, 20) + '...',
          template,
          uid: context.auth?.uid,
        });
      }
      throw error;
    }

    // Build template input and send email
    let templateInput: TemplateInput;
    try {
      templateInput = await buildTemplateInput(template, data, targetEmail, context);
      logger.info('sendTransactionalEmail: template built', { template });
    } catch (error) {
      logger.error('sendTransactionalEmail: template build failed', {
        template,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }

    const { subject, html } = buildEmailTemplate(templateInput);
    
    const result = await sendEmail({
      to: targetEmail,
      subject,
      html,
      type: template, // Pass template type for logging
    });

    const duration = Date.now() - startTime;

    if (!result.success) {
      logger.error('sendTransactionalEmail: email send failed', {
        template,
        error: result.error,
        duration,
        uid: context.auth?.uid,
      });
      throw new functions.https.HttpsError(
        'internal',
        result.error || 'Failed to send email'
      );
    }

    logger.info('sendTransactionalEmail: success', {
      template,
      messageId: result.messageId,
      duration,
      uid: context.auth?.uid,
    });

    return {
      success: true,
      template,
      messageId: result.messageId,
    };
  });

