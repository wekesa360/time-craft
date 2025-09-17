/**
 * Settings Page Skeleton Screen
 * Loading state for settings and profile pages
 */

import React from 'react';
import { 
  Skeleton, 
  FormFieldSkeleton, 
  ButtonSkeleton, 
  AvatarSkeleton,
  ListItemSkeleton
} from '../ui/Skeleton';

export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <div className="flex space-x-8">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Section */}
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-6" />
            
            {/* Avatar Upload */}
            <div className="flex items-center space-x-6 mb-6">
              <AvatarSkeleton size="xl" />
              <div className="flex-1">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-64 mb-4" />
                <div className="flex space-x-3">
                  <ButtonSkeleton size="sm" className="w-24" />
                  <ButtonSkeleton variant="ghost" size="sm" className="w-20" />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
            
            <div className="mt-6">
              <FormFieldSkeleton />
            </div>

            <div className="flex justify-end mt-6">
              <ButtonSkeleton className="w-32" />
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
            <Skeleton className="h-6 w-48 mb-6" />
            
            <div className="space-y-6">
              {/* Email Notifications */}
              <div>
                <Skeleton className="h-5 w-36 mb-4" />
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <Skeleton className="h-4 w-48 mb-1" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Push Notifications */}
              <div>
                <Skeleton className="h-5 w-40 mb-4" />
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <Skeleton className="h-4 w-40 mb-1" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
            <Skeleton className="h-6 w-40 mb-6" />
            
            <div className="space-y-6">
              {/* Password Change */}
              <div>
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="space-y-4">
                  <FormFieldSkeleton />
                  <FormFieldSkeleton />
                  <FormFieldSkeleton />
                </div>
                <div className="mt-4">
                  <ButtonSkeleton className="w-36" />
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Two-Factor Authentication */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                  </div>
                  <ButtonSkeleton variant="ghost" className="w-20" />
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Active Sessions */}
              <div>
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <ButtonSkeleton variant="ghost" size="sm" className="w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Overview */}
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-4">
              <div className="text-center">
                <Skeleton className="h-8 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-32 mx-auto mb-4" />
                <Skeleton className="h-6 w-24 mx-auto rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <ButtonSkeleton size="sm" className="w-full" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <ButtonSkeleton key={index} variant="ghost" size="sm" className="w-full justify-start" />
              ))}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};