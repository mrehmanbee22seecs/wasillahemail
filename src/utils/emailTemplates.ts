/**
 * Email Templates
 * Central place to generate subjects and bodies for common transactional emails.
 *
 * NOTE:
 * - Actual sending is handled by `resendEmailService` or other adapters.
 * - This file is intentionally lightweight and Blaze/Spark‑friendly (no extra deps).
 */

export type WelcomeEmailRole = 'student' | 'ngo' | 'volunteer' | 'admin';

export interface WelcomeEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface SimpleEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generate a role‑specific welcome email template.
 * This is UI/content-only; sending is handled elsewhere.
 */
export function getWelcomeEmailTemplate(options: {
  name: string;
  role: WelcomeEmailRole;
}): WelcomeEmailTemplate {
  const { name, role } = options;

  const roleLines: Record<WelcomeEmailRole, string> = {
    student:
      'Build your CSR portfolio, track your impact hours, and discover projects that align with your studies.',
    ngo:
      'Post projects, manage applications, and collaborate with passionate volunteers to scale your impact.',
    volunteer:
      'Discover meaningful opportunities, track your hours, and see the real impact of your contributions.',
    admin:
      'Manage users, projects, and system health to keep the Wasillah platform running smoothly.',
  };

  const subject = `Welcome to Wasillah, ${name || 'Friend'} 👋`;

  const intro =
    'Thank you for joining the Wasillah community – Pakistan’s volunteer & CSR collaboration platform.';

  const roleLine = roleLines[role] || roleLines.volunteer;

  const ctaText = 'Start exploring opportunities';

  const text = [
    `Assalamu Alaikum ${name || 'Friend'},`,
    '',
    intro,
    '',
    roleLine,
    '',
    `Visit your dashboard to get started: ${typeof window !== 'undefined' ? window.location.origin + '/dashboard' : 'https://wasillah.org/dashboard'}`,
    '',
    'With prayers,',
    'The Wasillah Team',
  ].join('\n');

  const dashboardUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/dashboard`
      : 'https://wasillah.org/dashboard';

  const html = `
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f5f5; padding:24px;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; padding:24px 24px 28px; box-shadow:0 10px 30px rgba(15,23,42,0.08);">
      <h1 style="margin:0 0 12px; font-size:24px; color:#0f172a;">Assalamu Alaikum ${name || 'Friend'},</h1>
      <p style="margin:0 0 12px; font-size:15px; color:#111827;">
        ${intro}
      </p>
      <p style="margin:0 0 16px; font-size:14px; color:#374151;">
        ${roleLine}
      </p>
      <p style="margin:0 0 20px; font-size:14px; color:#4b5563;">
        Your personalized dashboard is now ready. You can update your profile, interests, and skills at any time to get better project recommendations.
      </p>
      <div style="margin:0 0 24px;">
        <a href="${dashboardUrl}"
           style="display:inline-block; padding:10px 20px; border-radius:999px; background:#f97316; color:#ffffff; font-weight:600; font-size:14px; text-decoration:none;">
          ${ctaText}
        </a>
      </div>
      <p style="margin:0 0 8px; font-size:13px; color:#6b7280;">
        With prayers,<br/>The Wasillah Team
      </p>
    </div>
  </div>
  `;

  return { subject, html, text };
}

/**
 * Simple project / event confirmation template.
 */
export function getSubmissionConfirmationTemplate(options: {
  name: string;
  type: 'project' | 'event' | 'volunteer';
  title: string;
}): SimpleEmailTemplate {
  const { name, type, title } = options;

  const labels: Record<typeof type, string> = {
    project: 'project submission',
    event: 'event registration',
    volunteer: 'volunteer application',
  } as any;

  const subject = `We’ve received your ${labels[type]} – "${title}"`;

  const text = [
    `Assalamu Alaikum ${name || 'Friend'},`,
    '',
    `JazakAllah for your ${labels[type]} on Wasillah: "${title}".`,
    'Our team or the respective organization will review it and get back to you if any next steps are required.',
    '',
    'You can always review your submissions from your dashboard.',
    '',
    'With gratitude,',
    'The Wasillah Team',
  ].join('\n');

  const html = `
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; padding:24px;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; padding:24px 24px 28px; box-shadow:0 10px 30px rgba(15,23,42,0.08);">
      <p style="margin:0 0 8px; font-size:14px; color:#111827;">
        Assalamu Alaikum ${name || 'Friend'},
      </p>
      <p style="margin:0 0 8px; font-size:14px; color:#374151;">
        JazakAllah for your ${labels[type]} on Wasillah:
      </p>
      <p style="margin:0 0 16px; font-size:15px; color:#111827; font-weight:600;">
        "${title}"
      </p>
      <p style="margin:0 0 12px; font-size:14px; color:#4b5563;">
        Our team or the respective organization will review it and get back to you if any next steps are required.
      </p>
      <p style="margin:0 0 12px; font-size:13px; color:#6b7280;">
        You can always review your submissions from your dashboard.
      </p>
      <p style="margin:0; font-size:13px; color:#6b7280;">
        With gratitude,<br/>The Wasillah Team
      </p>
    </div>
  </div>
  `;

  return { subject, html, text };
}

/**
 * Generic reminder template for projects/events/tasks.
 */
export function getReminderEmailTemplate(options: {
  name: string;
  title: string;
  message: string;
}): SimpleEmailTemplate {
  const { name, title, message } = options;

  const subject = `Reminder: ${title}`;

  const text = [
    `Assalamu Alaikum ${name || 'Friend'},`,
    '',
    message,
    '',
    'With prayers,',
    'The Wasillah Team',
  ].join('\n');

  const html = `
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; padding:24px;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; padding:24px 24px 28px; box-shadow:0 10px 30px rgba(15,23,42,0.08);">
      <p style="margin:0 0 8px; font-size:14px; color:#111827;">
        Assalamu Alaikum ${name || 'Friend'},
      </p>
      <p style="margin:0 0 8px; font-size:15px; color:#111827; font-weight:600;">
        ${title}
      </p>
      <p style="margin:0 0 12px; font-size:14px; color:#4b5563;">
        ${message}
      </p>
      <p style="margin:0; font-size:13px; color:#6b7280;">
        With prayers,<br/>The Wasillah Team
      </p>
    </div>
  </div>
  `;

  return { subject, html, text };
}


