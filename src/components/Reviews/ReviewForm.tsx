import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';

interface ReviewFormProps {
  submitting: boolean;
  onSubmit: (payload: { rating: number; comment: string }) => Promise<void>;
  disabledReason?: string | null;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ submitting, onSubmit, disabledReason }) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const canSubmit = !disabledReason && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!canSubmit) return;

    if (!rating || rating < 1 || rating > 5) {
      setLocalError('Please select a rating between 1 and 5 stars.');
      return;
    }

    if (!comment.trim()) {
      setLocalError('Please add a brief comment about your experience.');
      return;
    }

    await onSubmit({ rating, comment });
    setComment('');
    setRating(5);
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Your Rating:</span>
        <div className="flex items-center gap-1">
          {stars.map((s) => (
            <button
              key={s}
              type="button"
              className="focus:outline-none"
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => setRating(s)}
            >
              <Star
                className={`w-5 h-5 ${
                  (hoverRating || rating) >= s
                    ? 'text-vibrant-orange fill-vibrant-orange'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-orange/60"
          rows={3}
          placeholder="Share your experience to help others..."
          disabled={!canSubmit}
        />
      </div>

      {localError && <p className="text-xs text-red-500">{localError}</p>}
      {disabledReason && !submitting && !localError && (
        <p className="text-xs text-gray-500">{disabledReason}</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold ${
          canSubmit
            ? 'bg-vibrant-orange text-white hover:bg-vibrant-orange-dark transition'
            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
        }`}
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Submit Review
      </button>
    </form>
  );
};

export default ReviewForm;


