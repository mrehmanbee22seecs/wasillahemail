/**
 * ListSkeleton Component
 * Loading skeleton for list-based layouts
 */

import React from 'react';

interface ListSkeletonProps {
  count?: number;
  className?: string;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 5, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md p-4 animate-pulse flex items-center gap-4"
        >
          {/* Avatar placeholder */}
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
          
          <div className="flex-1 space-y-2">
            {/* Title placeholder */}
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            
            {/* Description placeholder */}
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          
          {/* Action button placeholder */}
          <div className="w-20 h-8 bg-gray-200 rounded flex-shrink-0"></div>
        </div>
      ))}
    </div>
  );
};

export default ListSkeleton;
