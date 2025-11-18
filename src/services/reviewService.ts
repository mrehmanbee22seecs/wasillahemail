import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type ReviewTargetType = 'project' | 'ngo';

export interface Review {
  id: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number; // 1-5
  comment: string;
  photos?: string[];
  createdById: string;
  createdByName?: string;
  createdAt: any;
  updatedAt?: any;
  verified?: boolean; // e.g. only participants/volunteers
  flagged?: boolean;
  response?: {
    text: string;
    respondedById: string;
    respondedByName?: string;
    respondedAt: any;
  };
}

export interface ReviewSummary {
  targetType: ReviewTargetType;
  targetId: string;
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<number, number>;
}

const REVIEWS_COLLECTION = 'reviews';

export async function submitReview(input: {
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment: string;
  photos?: string[];
  userId: string;
  userName?: string;
}): Promise<Review> {
  const { targetType, targetId, rating, comment, photos, userId, userName } = input;

  const clampedRating = Math.min(5, Math.max(1, Math.round(rating)));

  const ref = await addDoc(collection(db, REVIEWS_COLLECTION), {
    targetType,
    targetId,
    rating: clampedRating,
    comment: comment.trim(),
    photos: photos || [],
    createdById: userId,
    createdByName: userName || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    verified: false,
    flagged: false,
  });

  const snap = await getDoc(ref);

  return { id: ref.id, ...(snap.data() as Omit<Review, 'id'>) };
}

export async function fetchReviewsForTarget(params: {
  targetType: ReviewTargetType;
  targetId: string;
  limitCount?: number;
}): Promise<Review[]> {
  const { targetType, targetId, limitCount = 25 } = params;

  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('targetType', '==', targetType),
    where('targetId', '==', targetId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }));
}

export async function fetchReviewSummary(params: {
  targetType: ReviewTargetType;
  targetId: string;
}): Promise<ReviewSummary> {
  const reviews = await fetchReviewsForTarget({ ...params, limitCount: 200 }); // reasonable cap on client

  if (reviews.length === 0) {
    return {
      targetType: params.targetType,
      targetId: params.targetId,
      averageRating: 0,
      totalReviews: 0,
      ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;

  for (const r of reviews) {
    const val = Math.max(1, Math.min(5, Math.round(r.rating)));
    ratingCounts[val] = (ratingCounts[val] || 0) + 1;
    total += val;
  }

  return {
    targetType: params.targetType,
    targetId: params.targetId,
    averageRating: total / reviews.length,
    totalReviews: reviews.length,
    ratingCounts,
  };
}

export async function respondToReview(input: {
  reviewId: string;
  text: string;
  respondedById: string;
  respondedByName?: string;
}): Promise<void> {
  const { reviewId, text, respondedById, respondedByName } = input;
  const ref = doc(db, REVIEWS_COLLECTION, reviewId);
  await updateDoc(ref, {
    response: {
      text: text.trim(),
      respondedById,
      respondedByName: respondedByName || null,
      respondedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
}

// Simple client-side check whether a user has already reviewed this target
export async function hasUserReviewedTarget(params: {
  targetType: ReviewTargetType;
  targetId: string;
  userId: string;
}): Promise<boolean> {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('targetType', '==', params.targetType),
    where('targetId', '==', params.targetId),
    where('createdById', '==', params.userId),
    limit(1)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}


