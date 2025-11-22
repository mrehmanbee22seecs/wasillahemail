/**
 * CardSkeleton Component
 * Loading skeleton for card-based layouts
 */

import React from 'react';

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 1, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`bg-white rounded-lg shadow-md p-6 animate-pulse ${className}`}
        >
          {/* Image placeholder */}
          <div className="h-48 bg-gray-200 rounded-md mb-4"></div>
          
          {/* Title placeholder */}
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          
          {/* Description placeholders */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          
          {/* Tags placeholder */}
          <div className="flex gap-2 mb-4">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          </div>
          
          {/* Button placeholder */}
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ))}
    </>
  );
};

export default CardSkeleton;
