import { db, Timestamp } from './firebase';

export async function updateKb(data: any) {
  if (!data || !data.id || !data.content) {
    throw new Error('Invalid KB update data');
  }

  const docRef = db.collection('knowledgeBase').doc(data.id);

  await docRef.set(
    {
      content: data.content,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  return { success: true, id: data.id };
}
