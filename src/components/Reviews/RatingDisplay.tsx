import React from 'react';
import { Star } from 'lucide-react';

interface RatingDisplayProps {
  rating: number;
  totalReviews?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  totalReviews,
  size = 'md',
  showValue = true,
}) => {
  const rounded = Math.round(rating * 10) / 10;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {stars.map((s) => (
          <Star
            key={s}
            className={`${sizeClasses[size]} ${
              s <= Math.round(rating)
                ? 'text-vibrant-orange fill-vibrant-orange'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-xs text-gray-700 ml-1">
          {rounded.toFixed(1)}
          {typeof totalReviews === 'number' && ` (${totalReviews})`}
        </span>
      )}
    </div>
  );
};

export default RatingDisplay;


