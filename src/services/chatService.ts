import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendMessageNotification } from '../utils/notificationHelpers';

export interface ProjectChatMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file';
  attachmentName?: string;
}

export interface TypingState {
  userId: string;
  userName: string;
  updatedAt: any;
}

const PROJECT_CHATS_COLLECTION = 'project_chats';

export function subscribeToProjectMessages(
  projectId: string,
  callback: (messages: ProjectChatMessage[]) => void
): () => void {
  const messagesRef = collection(db, `${PROJECT_CHATS_COLLECTION}/${projectId}/messages`);
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const list: ProjectChatMessage[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        projectId,
        senderId: data.senderId,
        senderName: data.senderName,
        text: data.text,
        createdAt: data.createdAt,
        attachmentUrl: data.attachmentUrl,
        attachmentType: data.attachmentType,
        attachmentName: data.attachmentName,
      });
    });
    callback(list);
  });
}

export function subscribeToTyping(
  projectId: string,
  callback: (typingUsers: TypingState[]) => void
): () => void {
  const typingRef = collection(db, `${PROJECT_CHATS_COLLECTION}/${projectId}/typing`);
  const q = query(typingRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: TypingState[] = [];
    const now = Date.now();
    snapshot.forEach((d) => {
      const data = d.data();
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
      // Only show typing if updated within last 8 seconds
      if (now - updatedAt.getTime() < 8000 && data.isTyping) {
        list.push({
          userId: data.userId,
          userName: data.userName,
          updatedAt: data.updatedAt,
        });
      }
    });
    callback(list);
  });
}

export async function setTypingState(
  projectId: string,
  userId: string,
  userName: string,
  isTyping: boolean
): Promise<void> {
  const ref = doc(db, `${PROJECT_CHATS_COLLECTION}/${projectId}/typing/${userId}`);
  await updateDoc(ref, {
    userId,
    userName,
    isTyping,
    updatedAt: serverTimestamp(),
  }).catch(async () => {
    await addDoc(collection(db, `${PROJECT_CHATS_COLLECTION}/${projectId}/typing`), {
      userId,
      userName,
      isTyping,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function sendProjectMessage(options: {
  projectId: string;
  text: string;
  senderId: string;
  senderName: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file';
  attachmentName?: string;
}): Promise<void> {
  const { projectId, text, senderId, senderName, attachmentUrl, attachmentType, attachmentName } = options;
  const trimmed = text.trim();
  if (!trimmed) return;

  const messagesRef = collection(db, `${PROJECT_CHATS_COLLECTION}/${projectId}/messages`);
  const msgDoc = await addDoc(messagesRef, {
    projectId,
    senderId,
    senderName,
    text: trimmed,
    attachmentUrl: attachmentUrl || null,
    attachmentType: attachmentType || null,
    attachmentName: attachmentName || null,
    createdAt: serverTimestamp(),
  });

  // Send notifications to project owner and participants (best-effort, non-blocking)
  (async () => {
    try {
      const projectRef = doc(db, 'project_submissions', projectId);
      const snap = await getDoc(projectRef);
      if (!snap.exists()) return;
      const data: any = snap.data();
      const ownerId: string | undefined = data.submittedBy;
      const participantIds: string[] = data.participantIds || [];
      const targetIds = new Set<string>();
      if (ownerId) targetIds.add(ownerId);
      participantIds.forEach((id) => targetIds.add(id));
      // Don't notify the sender
      targetIds.delete(senderId);

      await Promise.all(
        Array.from(targetIds).map((userId) =>
          sendMessageNotification({
            messageId: msgDoc.id,
            senderName,
            message: trimmed,
            userId,
            link: `/projects/${projectId}`,
          })
        )
      );
    } catch (error) {
      console.error('Error sending project chat notifications:', error);
    }
  })();
}


