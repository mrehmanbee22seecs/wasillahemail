/**
 * Content Versioning Hook
 * Manages content version history with save, restore, and diff functionality
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit as limitQuery,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ContentVersion } from '../types/cms';

interface VersionData {
  content: string;
  contentJSON?: any;
  metadata: Record<string, any>;
  changeMessage?: string;
}

interface UseContentVersioningReturn {
  versions: ContentVersion[];
  currentVersion: ContentVersion | null;
  isLoading: boolean;
  error: string | null;
  saveVersion: (versionData: VersionData) => Promise<void>;
  restoreVersion: (versionId: string) => Promise<ContentVersion>;
  compareVersions: (versionId1: string, versionId2: string) => VersionDiff;
  getVersionHistory: (limit?: number) => Promise<ContentVersion[]>;
  undoLastChange: () => Promise<void>;
  redoLastUndo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
}

interface VersionDiff {
  additions: string[];
  deletions: string[];
  modifications: string[];
  summary: string;
}

const VERSIONS_COLLECTION = 'content_versions';
const MAX_VERSIONS = 50; // Keep last 50 versions per content
const MAX_UNDO_STACK = 10; // Maximum undo/redo history

export function useContentVersioning(contentId?: string): UseContentVersioningReturn {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<ContentVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<ContentVersion[]>([]);
  const [redoStack, setRedoStack] = useState<ContentVersion[]>([]);

  // Load version history when contentId changes
  useEffect(() => {
    if (contentId) {
      loadVersionHistory();
    }
  }, [contentId]);

  /**
   * Load all versions for the content
   */
  const loadVersionHistory = useCallback(async () => {
    if (!contentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const versionsQuery = query(
        collection(db, VERSIONS_COLLECTION),
        where('contentId', '==', contentId),
        orderBy('createdAt', 'desc'),
        limitQuery(MAX_VERSIONS)
      );

      const snapshot = await getDocs(versionsQuery);
      const versionsList: ContentVersion[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          contentId: data.contentId,
          versionNumber: data.versionNumber,
          content: data.content,
          contentJSON: data.contentJSON,
          title: data.title,
          excerpt: data.excerpt,
          authorId: data.authorId,
          authorName: data.authorName,
          changeMessage: data.changeMessage,
          createdAt: data.createdAt?.toDate() || new Date(),
          characterCount: data.characterCount || 0,
          wordCount: data.wordCount || 0,
        };
      });

      setVersions(versionsList);
      if (versionsList.length > 0) {
        setCurrentVersion(versionsList[0]);
      }
    } catch (err) {
      console.error('Failed to load version history:', err);
      setError('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  }, [contentId]);

  /**
   * Save a new version
   */
  const saveVersion = useCallback(
    async (versionData: VersionData) => {
      if (!contentId) {
        throw new Error('Content ID is required to save version');
      }

      setIsLoading(true);
      setError(null);

      try {
        // Calculate character and word counts
        const characterCount = versionData.content.length;
        const wordCount = versionData.content
          .split(/\s+/)
          .filter((word) => word.length > 0).length;

        // Get next version number
        const nextVersionNumber = versions.length > 0 ? versions[0].versionNumber + 1 : 1;

        // Get current user info (would normally come from auth context)
        const authorId = 'current-user-id'; // Replace with actual user ID
        const authorName = 'Current User'; // Replace with actual user name

        const newVersion: Omit<ContentVersion, 'id'> = {
          contentId,
          versionNumber: nextVersionNumber,
          content: versionData.content,
          contentJSON: versionData.contentJSON,
          title: versionData.metadata.title || '',
          excerpt: versionData.metadata.excerpt || '',
          authorId,
          authorName,
          changeMessage: versionData.changeMessage || 'Content updated',
          createdAt: new Date(),
          characterCount,
          wordCount,
        };

        // Save to Firestore
        const versionRef = doc(collection(db, VERSIONS_COLLECTION));
        await setDoc(versionRef, {
          ...newVersion,
          createdAt: Timestamp.fromDate(newVersion.createdAt),
        });

        const savedVersion: ContentVersion = {
          id: versionRef.id,
          ...newVersion,
        };

        // Update local state
        setVersions([savedVersion, ...versions.slice(0, MAX_VERSIONS - 1)]);
        setCurrentVersion(savedVersion);

        // Add to undo stack
        if (currentVersion) {
          setUndoStack([currentVersion, ...undoStack.slice(0, MAX_UNDO_STACK - 1)]);
          setRedoStack([]); // Clear redo stack on new save
        }

        // Clean up old versions if exceeding limit
        if (versions.length >= MAX_VERSIONS) {
          // In production, you'd want to delete old versions from Firestore
          console.log('Version limit reached, consider cleaning up old versions');
        }
      } catch (err) {
        console.error('Failed to save version:', err);
        setError('Failed to save version');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [contentId, versions, currentVersion, undoStack]
  );

  /**
   * Restore a specific version
   */
  const restoreVersion = useCallback(
    async (versionId: string): Promise<ContentVersion> => {
      const versionToRestore = versions.find((v) => v.id === versionId);

      if (!versionToRestore) {
        throw new Error('Version not found');
      }

      setIsLoading(true);
      setError(null);

      try {
        // Save current state to undo stack before restoring
        if (currentVersion) {
          setUndoStack([currentVersion, ...undoStack.slice(0, MAX_UNDO_STACK - 1)]);
        }

        // Create a new version with restored content
        await saveVersion({
          content: versionToRestore.content,
          contentJSON: versionToRestore.contentJSON,
          metadata: {
            title: versionToRestore.title,
            excerpt: versionToRestore.excerpt,
          },
          changeMessage: `Restored version ${versionToRestore.versionNumber}`,
        });

        return versionToRestore;
      } catch (err) {
        console.error('Failed to restore version:', err);
        setError('Failed to restore version');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [versions, currentVersion, undoStack, saveVersion]
  );

  /**
   * Compare two versions and return differences
   */
  const compareVersions = useCallback(
    (versionId1: string, versionId2: string): VersionDiff => {
      const version1 = versions.find((v) => v.id === versionId1);
      const version2 = versions.find((v) => v.id === versionId2);

      if (!version1 || !version2) {
        return {
          additions: [],
          deletions: [],
          modifications: [],
          summary: 'Unable to compare versions',
        };
      }

      // Simple line-by-line diff
      const lines1 = version1.content.split('\n');
      const lines2 = version2.content.split('\n');

      const additions: string[] = [];
      const deletions: string[] = [];
      const modifications: string[] = [];

      // Find additions and modifications
      lines2.forEach((line, index) => {
        if (index >= lines1.length) {
          additions.push(line);
        } else if (line !== lines1[index]) {
          modifications.push(`Line ${index + 1}: "${lines1[index]}" → "${line}"`);
        }
      });

      // Find deletions
      if (lines1.length > lines2.length) {
        deletions.push(
          ...lines1.slice(lines2.length).map((line, index) => `Line ${lines2.length + index + 1}: "${line}"`)
        );
      }

      const summary = `${additions.length} additions, ${deletions.length} deletions, ${modifications.length} modifications`;

      return {
        additions,
        deletions,
        modifications,
        summary,
      };
    },
    [versions]
  );

  /**
   * Get version history with optional limit
   */
  const getVersionHistory = useCallback(
    async (limit?: number): Promise<ContentVersion[]> => {
      if (!contentId) return [];

      const historyQuery = query(
        collection(db, VERSIONS_COLLECTION),
        where('contentId', '==', contentId),
        orderBy('createdAt', 'desc'),
        limitQuery(limit || MAX_VERSIONS)
      );

      const snapshot = await getDocs(historyQuery);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as ContentVersion;
      });
    },
    [contentId]
  );

  /**
   * Undo last change
   */
  const undoLastChange = useCallback(async () => {
    if (undoStack.length === 0) return;

    const previousVersion = undoStack[0];
    setIsLoading(true);

    try {
      // Move current version to redo stack
      if (currentVersion) {
        setRedoStack([currentVersion, ...redoStack.slice(0, MAX_UNDO_STACK - 1)]);
      }

      // Restore previous version
      setCurrentVersion(previousVersion);
      setUndoStack(undoStack.slice(1));

      // Create new version with restored content
      await saveVersion({
        content: previousVersion.content,
        contentJSON: previousVersion.contentJSON,
        metadata: {
          title: previousVersion.title,
          excerpt: previousVersion.excerpt,
        },
        changeMessage: 'Undo',
      });
    } catch (err) {
      console.error('Undo failed:', err);
      setError('Undo failed');
    } finally {
      setIsLoading(false);
    }
  }, [undoStack, redoStack, currentVersion, saveVersion]);

  /**
   * Redo last undo
   */
  const redoLastUndo = useCallback(async () => {
    if (redoStack.length === 0) return;

    const nextVersion = redoStack[0];
    setIsLoading(true);

    try {
      // Move current version back to undo stack
      if (currentVersion) {
        setUndoStack([currentVersion, ...undoStack.slice(0, MAX_UNDO_STACK - 1)]);
      }

      // Restore next version
      setCurrentVersion(nextVersion);
      setRedoStack(redoStack.slice(1));

      // Create new version with restored content
      await saveVersion({
        content: nextVersion.content,
        contentJSON: nextVersion.contentJSON,
        metadata: {
          title: nextVersion.title,
          excerpt: nextVersion.excerpt,
        },
        changeMessage: 'Redo',
      });
    } catch (err) {
      console.error('Redo failed:', err);
      setError('Redo failed');
    } finally {
      setIsLoading(false);
    }
  }, [redoStack, undoStack, currentVersion, saveVersion]);

  return {
    versions,
    currentVersion,
    isLoading,
    error,
    saveVersion,
    restoreVersion,
    compareVersions,
    getVersionHistory,
    undoLastChange,
    redoLastUndo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}

export default useContentVersioning;
