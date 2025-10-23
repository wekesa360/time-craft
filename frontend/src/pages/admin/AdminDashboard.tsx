/**
 * Admin Dashboard Page
 * System overview and administration interface
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { 
  UserManagement, 
  SystemMetrics, 
  FeatureFlags, 
  SupportTickets, 
  AuditLog 
} from '../../components/features/admin';
import { FadeIn, Stagger } from '../../components/ui/animations';
import { Button } from '../../components/ui';

type AdminView = 'overview' | 'users' | 'system' | 'features' | 'support' | 'audit';

const AdminDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [isAuthorized, setIsAuthorized] = useState(true); // In real app, check user role

  // Mock admin verification - in real app, this would check JWT/session
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You don't have permission to access the admin dashboard.
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      id: 'overview' as const,
      name: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'System overview and key metrics',
    },
    {
      id: 'users' as const,
      name: 'User Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      description: 'Manage users, roles, and permissions',
    },
    {
      id: 'system' as const,
      name: 'System Health',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Monitor system performance and health',
    },
    {
      id: 'features' as const,
      name: 'Feature Flags',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
      description: 'Manage feature rollouts and A/B tests',
    },
    {
      id: 'support' as const,
      name: 'Support Tickets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      description: 'Handle user support requests',
    },
    {
      id: 'audit' as const,
      name: 'Audit Log',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'View system and admin action logs',
    },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <AdminOverview />;
      case 'users':
        return <UserManagement />;
      case 'system':
        return <SystemMetrics />;
      case 'features':
        return <FeatureFlags />;
      case 'support':
        return <SupportTickets />;
      case 'audit':
        return <AuditLog />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <FadeIn>
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">⚙️</div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    System administration and monitoring
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation Sidebar */}
          <FadeIn delay={0.1}>
            <div className="lg:w-64 flex-shrink-0">
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={cn(
                      'w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200',
                      activeView === item.id
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className={cn(
                      'flex-shrink-0',
                      activeView === item.id ? 'text-primary-600 dark:text-primary-400' : ''
                    )}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs opacity-75 truncate">
                        {item.description}
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </FadeIn>

          {/* Main Content */}
          <FadeIn delay={0.2}>
            <div className="flex-1 min-w-0">
              {renderContent()}
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

// Admin Overview Component
const AdminOverview: React.FC = () => {
  const stats = [
    {
      name: 'Total Users',
      value: '12,543',
      change: '+12%',
      changeType: 'positive' as const,
      icon: '👥',
    },
    {
      name: 'Active Sessions',
      value: '1,234',
      change: '+5%',
      changeType: 'positive' as const,
      icon: '🔄',
    },
    {
      name: 'System Health',
      value: '99.9%',
      change: '+0.1%',
      changeType: 'positive' as const,
      icon: '💚',
    },
    {
      name: 'Support Tickets',
      value: '23',
      change: '-15%',
      changeType: 'positive' as const,
      icon: '🎫',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'user_registration',
      message: 'New user registered: john.doe@example.com',
      timestamp: '2 minutes ago',
      severity: 'info' as const,
    },
    {
      id: 2,
      type: 'system_alert',
      message: 'High CPU usage detected on server-02',
      timestamp: '15 minutes ago',
      severity: 'warning' as const,
    },
    {
      id: 3,
      type: 'feature_flag',
      message: 'Feature flag "new-dashboard" enabled for 50% of users',
      timestamp: '1 hour ago',
      severity: 'info' as const,
    },
    {
      id: 4,
      type: 'support_ticket',
      message: 'New support ticket #1234 created',
      timestamp: '2 hours ago',
      severity: 'info' as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <Stagger stagger={0.1} direction="up">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <motion.div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className={cn(
                    'text-sm',
                    stat.changeType === 'positive' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  )}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </Stagger>

      {/* Recent Activity */}
      <FadeIn delay={0.3}>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full mt-2',
                    activity.severity === 'warning' ? 'bg-yellow-500' :
                    activity.severity === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Quick Actions */}
      <FadeIn delay={0.4}>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Create User</div>
                <div className="text-sm opacity-75">Add a new user account</div>
              </div>
            </Button>
            <Button className="justify-start h-auto p-4" variant="outline">
              <div className="text-left">
                <div className="font-medium">System Backup</div>
                <div className="text-sm opacity-75">Create system backup</div>
              </div>
            </Button>
            <Button className="justify-start h-auto p-4" variant="outline">
              <div className="text-left">
                <div className="font-medium">Send Announcement</div>
                <div className="text-sm opacity-75">Notify all users</div>
              </div>
            </Button>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default AdminDashboard;