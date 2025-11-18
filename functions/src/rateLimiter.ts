import * as functions from 'firebase-functions';
import { db, FieldValue, Timestamp } from './firebase';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_EMAILS_PER_WINDOW = 5;
const COLLECTION = 'email_throttle';

export async function enforceRateLimit(
  key: string,
  options?: {
    limit?: number;
    windowMs?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  if (!key) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Throttle key is required'
    );
  }

  const limit = options?.limit ?? MAX_EMAILS_PER_WINDOW;
  const windowMs = options?.windowMs ?? WINDOW_MS;
  const now = Date.now();
  const windowStart = now - windowMs;
  const docRef = db.collection(COLLECTION).doc(key);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = snap.data() as
      | {
          count: number;
          windowStart: FirebaseFirestore.Timestamp;
        }
      | undefined;

    if (!snap.exists || !data?.windowStart || data.windowStart.toMillis() < windowStart) {
      tx.set(docRef, {
        count: 1,
        windowStart: Timestamp.fromMillis(now),
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromMillis(now + 2 * windowMs),
        metadata: options?.metadata || {},
      });
      return;
    }

    if (data.count >= limit) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Hourly email quota exceeded. Please try again later.'
      );
    }

    tx.update(docRef, {
      count: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
      metadata: options?.metadata || {},
    });
  });
}
