import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { 
  Users, 
  Activity, 
  Shield, 
  BarChart3, 
  Settings, 
  AlertTriangle,
  TrendingUp,
  Database
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Active Sessions',
      value: '89',
      change: '+5%',
      icon: Activity,
      color: 'text-green-600'
    },
    {
      title: 'Security Alerts',
      value: '3',
      change: '-2',
      icon: Shield,
      color: 'text-red-600'
    },
    {
      title: 'System Health',
      value: '98%',
      change: '+1%',
      icon: TrendingUp,
      color: 'text-green-600'
    }
  ];

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: Users,
      href: '/admin/users'
    },
    {
      title: 'System Metrics',
      description: 'View system performance',
      icon: BarChart3,
      href: '/admin/metrics'
    },
    {
      title: 'Security Dashboard',
      description: 'Monitor security events',
      icon: Shield,
      href: '/admin/security'
    },
    {
      title: 'System Settings',
      description: 'Configure system settings',
      icon: Settings,
      href: '/admin/settings'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('admin.dashboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('admin.dashboard.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Database className="w-4 h-4 mr-2" />
            {t('admin.dashboard.refresh')}
          </Button>
          <Button size="sm">
            <Settings className="w-4 h-4 mr-2" />
            {t('admin.dashboard.settings')}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className={`text-sm ${stat.color}`}>
                    {stat.change}
                  </p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.dashboard.quickActions')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <action.icon className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            {t('admin.dashboard.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  New user registered: john.doe@example.com
                </p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  System backup completed successfully
                </p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  Security alert: Multiple failed login attempts
                </p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
