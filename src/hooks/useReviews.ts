import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Review,
  ReviewSummary,
  ReviewTargetType,
  fetchReviewsForTarget,
  fetchReviewSummary,
  hasUserReviewedTarget,
  submitReview,
} from '../services/reviewService';

export interface UseReviewsState {
  reviews: Review[];
  summary: ReviewSummary | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  hasReviewed: boolean;
  submit: (payload: { rating: number; comment: string; photos?: string[] }) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReviews(targetType: ReviewTargetType, targetId: string | null): UseReviewsState {
  const { currentUser, userData } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState<boolean>(false);

  const load = useCallback(async () => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [reviewsData, summaryData] = await Promise.all([
        fetchReviewsForTarget({ targetType, targetId }),
        fetchReviewSummary({ targetType, targetId }),
      ]);

      setReviews(reviewsData);
      setSummary(summaryData);

      if (currentUser?.uid) {
        const already = await hasUserReviewedTarget({
          targetType,
          targetId,
          userId: currentUser.uid,
        });
        setHasReviewed(already);
      } else {
        setHasReviewed(false);
      }
    } catch (err: any) {
      console.error('Error loading reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType, currentUser?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const submit = useCallback(
    async (payload: { rating: number; comment: string; photos?: string[] }) => {
      if (!currentUser?.uid || !targetId) {
        setError('You must be logged in to submit a review.');
        return;
      }

      try {
        setSubmitting(true);
        setError(null);

        await submitReview({
          targetType,
          targetId,
          rating: payload.rating,
          comment: payload.comment,
          photos: payload.photos,
          userId: currentUser.uid,
          userName: userData?.displayName || currentUser.displayName || undefined,
        });

        await refresh();
      } catch (err: any) {
        console.error('Error submitting review:', err);
        setError(err.message || 'Failed to submit review');
      } finally {
        setSubmitting(false);
      }
    },
    [currentUser?.uid, currentUser?.displayName, targetId, targetType, refresh, userData?.displayName]
  );

  return {
    reviews,
    summary,
    loading,
    submitting,
    error,
    hasReviewed,
    submit,
    refresh,
  };
}


