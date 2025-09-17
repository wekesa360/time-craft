/**
 * Focus and Productivity Skeleton Components
 * Loading states for focus sessions and productivity features
 */

import React from 'react';
import { 
  Skeleton, 
  ChartSkeleton,
  ButtonSkeleton
} from '../ui/Skeleton';

export const FocusSessionSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-5 w-64 mx-auto" />
      </div>

      {/* Timer Display */}
      <div className="bg-white dark:bg-gray-800 border rounded-lg p-8 text-center">
        <Skeleton className="h-32 w-32 rounded-full mx-auto mb-6" />
        <Skeleton className="h-12 w-40 mx-auto mb-4" />
        <div className="flex justify-center space-x-4 mb-6">
          <ButtonSkeleton className="w-24" />
          <ButtonSkeleton className="w-24" />
          <ButtonSkeleton className="w-24" />
        </div>
        <div className="flex justify-center space-x-8">
          <div className="text-center">
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        </div>
      </div>

      {/* Session Settings */}
      <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="mb-4">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
        <Skeleton className="h-6 w-36 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const FocusStatsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Focus Chart */}
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <ChartSkeleton height={200} />
        </div>

        {/* Focus Categories */}
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
          <Skeleton className="h-6 w-36 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-2 w-20 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Productivity Trends */}
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <ChartSkeleton height={180} />
          <div className="flex justify-center space-x-6 mt-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="text-center">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-6 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Focus Goals */}
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-2 flex-1 rounded-full" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session History */}
      <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <div className="overflow-hidden">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-8 w-full"
                style={{
                  opacity: Math.random() * 0.7 + 0.3
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};