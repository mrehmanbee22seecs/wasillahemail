/**
 * Content Service
 * Handles all content CRUD operations and versioning
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Content, ContentVersion, ContentFilters, ContentStatus } from '../types/cms';

const CONTENT_COLLECTION = 'content';
const VERSIONS_COLLECTION = 'content_versions';

/**
 * Create new content
 */
export async function createContent(
  content: Omit<Content, 'id' | 'createdAt' | 'updatedAt' | 'currentVersion' | 'viewCount' | 'editCount' | 'versionCount'>
): Promise<string> {
  const contentRef = doc(collection(db, CONTENT_COLLECTION));
  const contentId = contentRef.id;

  const newContent: Content = {
    ...content,
    id: contentId,
    currentVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    viewCount: 0,
    editCount: 0,
    versionCount: 1,
  };

  await setDoc(contentRef, {
    ...newContent,
    createdAt: Timestamp.fromDate(newContent.createdAt),
    updatedAt: Timestamp.fromDate(newContent.updatedAt),
    publishedAt: newContent.publishedAt ? Timestamp.fromDate(newContent.publishedAt) : null,
    scheduledFor: newContent.scheduledFor ? Timestamp.fromDate(newContent.scheduledFor) : null,
  });

  // Create initial version
  await createContentVersion(contentId, {
    content: content.content,
    contentJSON: content.contentJSON,
    metadata: content.metadata,
    changeMessage: 'Initial version',
  });

  return contentId;
}

/**
 * Get content by ID
 */
export async function getContentById(contentId: string): Promise<Content | null> {
  const contentDoc = await getDoc(doc(db, CONTENT_COLLECTION, contentId));
  
  if (!contentDoc.exists()) {
    return null;
  }

  const data = contentDoc.data();
  return {
    ...data,
    id: contentDoc.id,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    publishedAt: data.publishedAt?.toDate(),
    scheduledFor: data.scheduledFor?.toDate(),
    archivedAt: data.archivedAt?.toDate(),
    deletedAt: data.deletedAt?.toDate(),
  } as Content;
}

/**
 * Update content
 */
export async function updateContent(
  contentId: string,
  updates: Partial<Content>,
  changeMessage?: string
): Promise<void> {
  const contentRef = doc(db, CONTENT_COLLECTION, contentId);
  
  // Get current content for versioning
  const currentContent = await getContentById(contentId);
  if (!currentContent) {
    throw new Error('Content not found');
  }

  // Update content
  await updateDoc(contentRef, {
    ...updates,
    updatedAt: Timestamp.now(),
    editCount: increment(1),
    versionCount: increment(1),
    currentVersion: increment(1),
  });

  // Create new version if content changed
  if (updates.content || updates.contentJSON) {
    await createContentVersion(contentId, {
      content: updates.content || currentContent.content,
      contentJSON: updates.contentJSON || currentContent.contentJSON,
      metadata: updates.metadata || currentContent.metadata,
      changeMessage: changeMessage || 'Content updated',
    });
  }
}

/**
 * Publish content
 */
export async function publishContent(contentId: string): Promise<void> {
  await updateDoc(doc(db, CONTENT_COLLECTION, contentId), {
    status: 'published',
    publishedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Schedule content
 */
export async function scheduleContent(contentId: string, scheduledFor: Date): Promise<void> {
  await updateDoc(doc(db, CONTENT_COLLECTION, contentId), {
    status: 'scheduled',
    scheduledFor: Timestamp.fromDate(scheduledFor),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Archive content
 */
export async function archiveContent(contentId: string): Promise<void> {
  await updateDoc(doc(db, CONTENT_COLLECTION, contentId), {
    status: 'archived',
    archivedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete content (soft delete)
 */
export async function deleteContent(contentId: string): Promise<void> {
  await updateDoc(doc(db, CONTENT_COLLECTION, contentId), {
    status: 'deleted',
    deletedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Increment view count
 */
export async function incrementViewCount(contentId: string): Promise<void> {
  await updateDoc(doc(db, CONTENT_COLLECTION, contentId), {
    viewCount: increment(1),
  });
}

/**
 * Get content list with filters
 */
export async function getContentList(filters?: ContentFilters, pageLimit = 20): Promise<Content[]> {
  let q = query(collection(db, CONTENT_COLLECTION));

  if (filters?.status && filters.status.length > 0) {
    q = query(q, where('status', 'in', filters.status));
  }

  if (filters?.type && filters.type.length > 0) {
    q = query(q, where('type', 'in', filters.type));
  }

  if (filters?.author) {
    q = query(q, where('metadata.author', '==', filters.author));
  }

  if (filters?.category) {
    q = query(q, where('metadata.category', '==', filters.category));
  }

  q = query(q, orderBy('updatedAt', 'desc'), limit(pageLimit));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
    publishedAt: doc.data().publishedAt?.toDate(),
    scheduledFor: doc.data().scheduledFor?.toDate(),
    archivedAt: doc.data().archivedAt?.toDate(),
    deletedAt: doc.data().deletedAt?.toDate(),
  })) as Content[];
}

/**
 * Create content version
 */
async function createContentVersion(
  contentId: string,
  versionData: {
    content: string;
    contentJSON?: any;
    metadata: any;
    changeMessage?: string;
  }
): Promise<string> {
  const versionRef = doc(collection(db, VERSIONS_COLLECTION));
  const currentContent = await getContentById(contentId);
  
  if (!currentContent) {
    throw new Error('Content not found');
  }

  const version: Omit<ContentVersion, 'id'> = {
    contentId,
    version: currentContent.currentVersion + 1,
    content: versionData.content,
    contentJSON: versionData.contentJSON,
    metadata: versionData.metadata,
    changeMessage: versionData.changeMessage,
    createdAt: new Date(),
    createdBy: versionData.metadata.author,
    createdByName: versionData.metadata.authorName,
    characterCount: versionData.content.length,
    wordCount: versionData.content.split(/\s+/).length,
  };

  await setDoc(versionRef, {
    ...version,
    createdAt: Timestamp.fromDate(version.createdAt),
  });

  return versionRef.id;
}

/**
 * Get content versions
 */
export async function getContentVersions(contentId: string): Promise<ContentVersion[]> {
  const q = query(
    collection(db, VERSIONS_COLLECTION),
    where('contentId', '==', contentId),
    orderBy('version', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate(),
  })) as ContentVersion[];
}

/**
 * Restore content to specific version
 */
export async function restoreContentVersion(contentId: string, versionId: string): Promise<void> {
  const versionDoc = await getDoc(doc(db, VERSIONS_COLLECTION, versionId));
  
  if (!versionDoc.exists()) {
    throw new Error('Version not found');
  }

  const version = versionDoc.data() as ContentVersion;
  
  await updateContent(
    contentId,
    {
      content: version.content,
      contentJSON: version.contentJSON,
      metadata: version.metadata,
    },
    `Restored to version ${version.version}`
  );
}

/**
 * Bulk update content status
 */
export async function bulkUpdateStatus(
  contentIds: string[],
  status: ContentStatus
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const contentId of contentIds) {
    try {
      await updateDoc(doc(db, CONTENT_COLLECTION, contentId), {
        status,
        updatedAt: Timestamp.now(),
      });
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to update ${contentId}: ${error}`);
    }
  }

  return results;
}
