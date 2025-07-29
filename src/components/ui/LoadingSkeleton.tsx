import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4' 
}) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}
    />
  );
};

interface LogboekTableSkeletonProps {
  rows?: number;
}

export const LogboekTableSkeleton: React.FC<LogboekTableSkeletonProps> = ({ 
  rows = 5 
}) => {
  return (
    <div className="space-y-2">
      {/* Header skeleton */}
      <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-t-lg">
        <div className="col-span-2">
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="col-span-3">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="col-span-3">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="col-span-1">
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="col-span-1">
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="col-span-1">
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="col-span-1">
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200">
          <div className="col-span-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <div className="col-span-3">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="col-span-1">
            <div className="flex items-center space-x-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface LogboekCardSkeletonProps {
  cards?: number;
}

export const LogboekCardSkeleton: React.FC<LogboekCardSkeletonProps> = ({ 
  cards = 3 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-4 w-20" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface LogboekFormSkeletonProps {
  fields?: number;
}

export const LogboekFormSkeleton: React.FC<LogboekFormSkeletonProps> = ({ 
  fields = 6 
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

interface LogboekFiltersSkeletonProps {}

export const LogboekFiltersSkeleton: React.FC<LogboekFiltersSkeletonProps> = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}; 