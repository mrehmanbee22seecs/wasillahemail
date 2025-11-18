import React from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { Review } from '../../services/reviewService';
import ReviewCard from './ReviewCard';

interface ReviewListProps {
  reviews: Review[];
  loading: boolean;
  error: string | null;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, loading, error }) => {
  if (loading) {
    return (
      <div className="py-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-vibrant-orange mx-auto" />
        <p className="text-xs text-gray-600 mt-1">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center text-xs text-red-500">
        Error loading reviews: {error}
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="py-6 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
        <MessageSquare className="w-6 h-6 text-gray-300" />
        <p>No reviews yet. Be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} />
      ))}
    </div>
  );
};

export default ReviewList;


