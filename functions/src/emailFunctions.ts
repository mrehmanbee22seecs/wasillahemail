import { sendEmail, SendEmailInput } from './resend';

export async function sendVerificationEmail(to: string) {
  const payload: SendEmailInput = {
    to,
    subject: 'Verify Your Email',
    html: '<p>Please verify your email by clicking <a href="#">here</a>.</p>',
    type: 'verification',
  };

  return await sendEmail(payload);
}

export async function sendWelcomeEmail(to: string) {
  const payload: SendEmailInput = {
    to,
    subject: 'Welcome!',
    html: '<p>Welcome to our platform!</p>',
    type: 'welcome',
  };

  return await sendEmail(payload);
}
