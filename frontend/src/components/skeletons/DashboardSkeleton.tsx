/**
 * Dashboard Skeleton Screen
 * Comprehensive loading state for the dashboard page
 */

import React from 'react';
import { 
  CardSkeleton, 
  ChartSkeleton, 
  ListItemSkeleton, 
  StatsSkeleton,
  Skeleton
} from '../ui/Skeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats Cards */}
      <StatsSkeleton items={4} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks and Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center p-3 border rounded-lg">
                  <Skeleton className="h-8 w-8 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Eisenhower Matrix */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="border rounded-lg p-4 min-h-[200px]">
                  <Skeleton className="h-5 w-32 mb-3" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, taskIndex) => (
                      <div key={taskIndex} className="p-2 border rounded">
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <Skeleton className="min-h-[300px] p-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32 mb-4" />
              {Array.from({ length: 5 }).map((_, index) => (
                <ListItemSkeleton key={index} showAvatar />
              ))}
            </div>
          </Skeleton>
        </div>

        {/* Right Column - Sidebar Content */}
        <div className="space-y-6">
          {/* Health Insights */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-12" />
              </div>
              <ChartSkeleton height={120} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            </div>
          </div>

          {/* Badge Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-2 flex-1 rounded-full" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <Skeleton className="h-6 w-36 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="h-6 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};