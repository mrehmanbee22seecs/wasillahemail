import { logger } from 'firebase-functions';
import { Resend } from 'resend';
import { getResendConfig } from './config';

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  type?: string; // Template type for logging (e.g., 'verification', 'welcome')
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

let resendClient: Resend | null = null;

const TRANSIENT_STATUS_CODES = new Set([408, 425, 429]);

function getClient(): Resend {
  if (resendClient) return resendClient;
  const { apiKey } = getResendConfig();
  resendClient = new Resend(apiKey);
  return resendClient;
}

function normalizeRecipients(to: string | string[]): string[] {
  if (Array.isArray(to)) return to.filter(Boolean);
  return [to].filter(Boolean);
}

function validatePayload(payload: SendEmailInput) {
  if (!payload) throw new Error('Email payload is required');
  const recipients = normalizeRecipients(payload.to);
  if (recipients.length === 0) throw new Error('At least one recipient is required');
  if (!payload.subject?.trim()) throw new Error('Email subject is required');
  if (!payload.html?.trim()) throw new Error('Email HTML body is required');
}

function isTransientError(error: any): boolean {
  const status =
    error?.status ||
    error?.statusCode ||
    error?.response?.status ||
    error?.response?.statusCode;
  if (typeof status === 'number') {
    if (TRANSIENT_STATUS_CODES.has(status) || status >= 500) return true;
  }
  const code = (error?.code || '').toString().toLowerCase();
  if (code.includes('timeout') || code.includes('temporarily')) return true;
  const message = (error?.message || '').toLowerCase();
  return /timeout|temporarily|retry/i.test(message);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmail(payload: SendEmailInput): Promise<SendEmailResult> {
  validatePayload(payload);
  const recipients = normalizeRecipients(payload.to);
  const { sender } = getResendConfig();
  const client = getClient();

  const attemptSend = async (): Promise<SendEmailResult> => {
    try {
      const { data, error } = await client.emails.send({
        from: sender,
        to: recipients,
        subject: payload.subject,
        html: payload.html,
        replyTo: payload.replyTo,
        headers: payload.headers,
        tags: payload.tags,
      });

      if (error) throw error;

      logger.info('Resend email sent successfully', {
        subject: payload.subject,
        type: payload.type || 'unknown',
        toCount: recipients.length,
        messageId: data?.id,
        recipient: recipients[0],
      });

      return { success: true, messageId: data?.id };
    } catch (error) {
      logger.error('Resend email failed', {
        error: error instanceof Error ? error.message : error,
        subject: payload.subject,
        type: payload.type || 'unknown',
        toCount: recipients.length,
      });
      throw error;
    }
  };

  try {
    return await attemptSend();
  } catch (error) {
    if (isTransientError(error)) {
      const backoffMs = 500 + Math.floor(Math.random() * 250);
      logger.warn('Transient error detected, retrying once', {
        error: error instanceof Error ? error.message : error,
        backoffMs,
        type: payload.type,
      });
      await sleep(backoffMs);
      try {
        const retryResult = await attemptSend();
        logger.info('Resend retry succeeded', {
          type: payload.type,
          subject: payload.subject,
        });
        return retryResult;
      } catch (retryError) {
        logger.error('Resend retry failed after transient error', {
          originalError: error instanceof Error ? error.message : error,
          retryError: retryError instanceof Error ? retryError.message : retryError,
          type: payload.type,
        });
        return {
          success: false,
          error: retryError instanceof Error ? retryError.message : 'Unknown resend error',
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown resend error',
    };
  }
}

export function resetResendClient() {
  resendClient = null;
}
