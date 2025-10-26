/**
 * Task List Skeleton Screen
 * Loading state for task management pages
 */

import React from 'react';
import { 
  Skeleton, 
  ListItemSkeleton, 
  ButtonSkeleton, 
  FormFieldSkeleton 
} from '../ui/Skeleton';

export const TaskListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <ButtonSkeleton size="md" className="w-32" />
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-muted border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="flex gap-2">
            <ButtonSkeleton variant="ghost" className="w-24" />
            <ButtonSkeleton variant="ghost" className="w-20" />
            <ButtonSkeleton variant="ghost" className="w-16" />
          </div>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-muted border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-8 w-12 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-muted border rounded-lg">
        {/* List Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Task Items */}
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="p-4">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-5 w-5 rounded mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-3" />
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                  
                  {/* Subtasks (for some items) */}
                  {index < 3 && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
                      {Array.from({ length: 2 }).map((_, subIndex) => (
                        <div key={subIndex} className="flex items-center space-x-3">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center space-x-2">
          <ButtonSkeleton size="sm" className="w-20" />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-8" />
          ))}
          <ButtonSkeleton size="sm" className="w-16" />
        </div>
      </div>
    </div>
  );
};

export const TaskDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <ButtonSkeleton variant="ghost" size="sm" className="w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex items-center space-x-2">
          <ButtonSkeleton variant="ghost" size="sm" className="w-16" />
          <ButtonSkeleton size="sm" className="w-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Info */}
          <div className="bg-white dark:bg-muted border rounded-lg p-6">
            <div className="flex items-start space-x-4 mb-6">
              <Skeleton className="h-6 w-6 rounded" />
              <div className="flex-1">
                <Skeleton className="h-7 w-full mb-2" />
                <div className="flex items-center space-x-4 mb-4">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
              
              <div>
                <Skeleton className="h-5 w-20 mb-2" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity/Comments */}
          <div className="bg-white dark:bg-muted border rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Properties */}
          <div className="bg-white dark:bg-muted border rounded-lg p-4">
            <Skeleton className="h-5 w-24 mb-4" />
            <div className="space-y-4">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white dark:bg-muted border rounded-lg p-4">
            <Skeleton className="h-5 w-24 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 border rounded">
                  <Skeleton className="h-8 w-8" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Tracking */}
          <div className="bg-white dark:bg-muted border rounded-lg p-4">
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="text-center space-y-3">
              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
              <ButtonSkeleton size="sm" className="w-24 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};