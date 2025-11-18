import * as functions from 'firebase-functions';
import { sendEmail } from './resend';
import { updateKb } from './updateKb';
import { sendTransactionalEmail } from './transactionalEmail';

// Example HTTP function
export const helloWorld = functions.https.onRequest(async (req, res) => {
  res.send('Hello from Firebase Functions!');
});

// Example email trigger function
export const sendTestEmail = functions.https.onRequest(async (req, res) => {
  try {
    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test Email',
      html: '<h1>Hello World</h1>',
    });
    res.send(result);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : 'Unknown error');
  }
});

// Example KB update function trigger
export const updateKnowledgeBase = functions.https.onRequest(async (req, res) => {
  try {
    const result = await updateKb(req.body);
    res.send(result);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : 'Unknown error');
  }
});

// Export transactional email function
export { sendTransactionalEmail };
