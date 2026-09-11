import React from 'react';

const PosSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex overflow-hidden animate-pulse">
      {/* Category Nav Skeleton */}
      <div className="w-64 border-r border-gray-800 bg-gray-900/50 p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-800 rounded-xl" />
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col bg-gray-900 p-6 space-y-6">
        <div className="h-8 bg-gray-800 w-48 rounded-lg" />
        <div className="h-4 bg-gray-800 w-64 rounded-lg" />
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-800 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Cart Skeleton */}
      <div className="w-96 border-l border-gray-800 bg-gray-900/50 p-6 space-y-6">
        <div className="h-8 bg-gray-800 w-32 rounded-lg" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-xl" />
          ))}
        </div>
        <div className="mt-auto pt-6 border-t border-gray-800 space-y-4">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-800 w-16 rounded" />
            <div className="h-4 bg-gray-800 w-16 rounded" />
          </div>
          <div className="h-14 bg-gray-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default PosSkeleton;
