import { useCallback, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export type SocialTargetType = 'project' | 'event' | 'ngo' | 'user' | 'thread';

export interface SocialLike {
  id: string;
  targetType: SocialTargetType;
  targetId: string;
  userId: string;
  createdAt: any;
}

export interface SocialComment {
  id: string;
  targetType: SocialTargetType;
  targetId: string;
  userId: string;
  userName?: string;
  text: string;
  createdAt: any;
}

export interface FollowRelation {
  id: string;
  followerId: string;
  followedId: string;
  createdAt: any;
}

// === Likes ===
export function useLikes(targetType: SocialTargetType, targetId: string | null) {
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState<SocialLike[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadLikes = useCallback(async () => {
    if (!targetId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const q = query(
        collection(db, 'social_likes'),
        where('targetType', '==', targetType),
        where('targetId', '==', targetId),
        limit(200)
      );
      const snapshot = await getDocs(q);
      setLikes(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SocialLike, 'id'>) })));
    } catch (err: any) {
      console.error('Error loading likes:', err);
      setError(err.message || 'Failed to load likes');
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    loadLikes();
  }, [loadLikes]);

  const toggleLike = useCallback(async () => {
    if (!currentUser?.uid || !targetId) {
      return;
    }
    try {
      const existing = likes.find((l) => l.userId === currentUser.uid);
      if (existing) {
        await deleteDoc(doc(db, 'social_likes', existing.id));
        setLikes((prev) => prev.filter((l) => l.id !== existing.id));
      } else {
        const ref = await addDoc(collection(db, 'social_likes'), {
          targetType,
          targetId,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
        });
        setLikes((prev) => [
          ...prev,
          { id: ref.id, targetType, targetId, userId: currentUser.uid, createdAt: serverTimestamp() },
        ]);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  }, [currentUser?.uid, targetId, targetType, likes]);

  const likedByMe = !!currentUser && likes.some((l) => l.userId === currentUser.uid);

  return {
    likesCount: likes.length,
    likedByMe,
    loading,
    error,
    toggleLike,
  };
}

// === Comments ===
export function useComments(targetType: SocialTargetType, targetId: string | null) {
  const { currentUser, userData } = useAuth();
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadComments = useCallback(async () => {
    if (!targetId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const q = query(
        collection(db, 'social_comments'),
        where('targetType', '==', targetType),
        where('targetId', '==', targetId),
        limit(200)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(
        (d) => ({ id: d.id, ...(d.data() as Omit<SocialComment, 'id'>) }) as SocialComment
      );
      // naive sort by createdAt desc if available
      items.sort((a, b) => {
        const aDate =
          a.createdAt && typeof (a.createdAt as any).toDate === 'function'
            ? (a.createdAt as any).toDate().getTime()
            : 0;
        const bDate =
          b.createdAt && typeof (b.createdAt as any).toDate === 'function'
            ? (b.createdAt as any).toDate().getTime()
            : 0;
        return bDate - aDate;
      });
      setComments(items);
    } catch (err: any) {
      console.error('Error loading comments:', err);
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = useCallback(
    async (text: string) => {
      if (!currentUser?.uid || !targetId) {
        setError('You must be logged in to comment.');
        return;
      }

      const trimmed = text.trim();
      if (!trimmed) return;

      try {
        setSubmitting(true);
        setError(null);
        const ref = await addDoc(collection(db, 'social_comments'), {
          targetType,
          targetId,
          userId: currentUser.uid,
          userName: userData?.displayName || currentUser.displayName || null,
          text: trimmed,
          createdAt: serverTimestamp(),
        });

        setComments((prev) => [
          {
            id: ref.id,
            targetType,
            targetId,
            userId: currentUser.uid,
            userName: userData?.displayName || currentUser.displayName || undefined,
            text: trimmed,
            createdAt: serverTimestamp(),
          },
          ...prev,
        ]);
      } catch (err: any) {
        console.error('Error adding comment:', err);
        setError(err.message || 'Failed to add comment');
      } finally {
        setSubmitting(false);
      }
    },
    [currentUser?.uid, currentUser?.displayName, targetId, targetType, userData?.displayName]
  );

  return {
    comments,
    loading,
    error,
    submitting,
    addComment,
  };
}

// === Follow ===
export function useFollow(targetUserId: string | null) {
  const { currentUser } = useAuth();
  const [following, setFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [relationId, setRelationId] = useState<string | null>(null);

  const loadFollow = useCallback(async () => {
    if (!currentUser?.uid || !targetUserId || currentUser.uid === targetUserId) {
      setLoading(false);
      setFollowing(false);
      setRelationId(null);
      return;
    }
    try {
      setLoading(true);
      const q = query(
        collection(db, 'user_follows'),
        where('followerId', '==', currentUser.uid),
        where('followedId', '==', targetUserId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setFollowing(true);
        setRelationId(snapshot.docs[0].id);
      } else {
        setFollowing(false);
        setRelationId(null);
      }
    } catch (err) {
      console.error('Error loading follow relation:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, targetUserId]);

  useEffect(() => {
    loadFollow();
  }, [loadFollow]);

  const toggleFollow = useCallback(async () => {
    if (!currentUser?.uid || !targetUserId || currentUser.uid === targetUserId) return;

    try {
      if (following && relationId) {
        await deleteDoc(doc(db, 'user_follows', relationId));
        setFollowing(false);
        setRelationId(null);
      } else if (!following) {
        const ref = await addDoc(collection(db, 'user_follows'), {
          followerId: currentUser.uid,
          followedId: targetUserId,
          createdAt: serverTimestamp(),
        });
        setFollowing(true);
        setRelationId(ref.id);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  }, [currentUser?.uid, targetUserId, following, relationId]);

  return {
    following,
    loading,
    toggleFollow,
  };
}


