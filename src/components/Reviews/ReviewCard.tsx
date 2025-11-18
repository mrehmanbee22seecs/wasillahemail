import React from 'react';
import { MessageCircle, User, Image as ImageIcon } from 'lucide-react';
import { Review } from '../../services/reviewService';
import RatingDisplay from './RatingDisplay';

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const createdDate =
    review.createdAt && typeof review.createdAt.toDate === 'function'
      ? review.createdAt.toDate()
      : null;

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cream-elegant flex items-center justify-center text-xs text-logo-navy">
            {review.createdByName ? review.createdByName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-logo-navy">
              {review.createdByName || 'Anonymous Volunteer'}
            </span>
            {createdDate && (
              <span className="text-xs text-gray-500">
                {createdDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>
        <RatingDisplay rating={review.rating} size="sm" showValue={false} />
      </div>

      <div className="flex gap-2 text-sm text-gray-800">
        <MessageCircle className="w-4 h-4 text-vibrant-orange flex-shrink-0 mt-0.5" />
        <p>{review.comment}</p>
      </div>

      {review.photos && review.photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {review.photos.map((url, idx) => (
            <div
              key={idx}
              className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
            >
              {url ? (
                <img src={url} alt="Review" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-5 h-5 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      )}

      {review.response && (
        <div className="mt-2 pl-3 border-l-2 border-vibrant-orange/60 bg-cream-elegant/40 rounded-r-lg py-2">
          <p className="text-xs uppercase tracking-wide text-vibrant-orange font-semibold mb-1">
            Response from NGO
          </p>
          <p className="text-sm text-gray-800">{review.response.text}</p>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;


