/**
 * Audit Log Component
 * Admin action tracking and audit trail
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { Button } from '../../ui';
import { FadeIn, Stagger } from '../../ui/animations';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  resource: string;
  resourceId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'user' | 'system' | 'security' | 'data' | 'config';
}

interface AuditLogProps {
  className?: string;
}

const AuditLog: React.FC<AuditLogProps> = ({ className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  // Mock data - in real app, this would come from API
  const auditEntries: AuditLogEntry[] = [
    {
      id: '1',
      timestamp: '2024-02-10T14:30:00Z',
      action: 'user.created',
      resource: 'User',
      resourceId: 'user_123',
      user: {
        id: 'admin1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      },
      details: {
        newUser: {
          email: 'newuser@example.com',
          name: 'New User',
          role: 'user',
        },
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      severity: 'medium',
      category: 'user',
    },
    {
      id: '2',
      timestamp: '2024-02-10T14:25:00Z',
      action: 'feature_flag.updated',
      resource: 'FeatureFlag',
      resourceId: 'flag_new_dashboard',
      user: {
        id: 'admin2',
        name: 'Product Manager',
        email: 'product@example.com',
        role: 'admin',
      },
      details: {
        changes: {
          rolloutPercentage: { from: 10, to: 25 },
          enabled: { from: false, to: true },
        },
      },
      ipAddress: '10.0.0.50',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      severity: 'high',
      category: 'config',
    },
  ];

  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch = entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || entry.category === filterCategory;
    const matchesSeverity = filterSeverity === 'all' || entry.severity === filterSeverity;
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const getSeverityColor = (severity: AuditLogEntry['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-error-light text-error dark:bg-error/20 dark:text-error-light';
      case 'high':
        return 'bg-primary-100 text-primary dark:bg-primary/20 dark:text-primary-300';
      case 'medium':
        return 'bg-warning-light text-warning dark:bg-warning/20 dark:text-warning-light';
      case 'low':
        return 'bg-success-light text-success dark:bg-success/20 dark:text-success-light';
      default:
        return 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground dark:text-white">
              Audit Log
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              Track admin actions and system events
            </p>
          </div>
          
          <Button variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </Button>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <div className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search audit log..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="user">User</option>
              <option value="system">System</option>
              <option value="security">Security</option>
              <option value="data">Data</option>
              <option value="config">Config</option>
            </select>
          </div>
        </div>
      </FadeIn>

      {/* Audit Entries */}
      <Stagger stagger={0.05} direction="up">
        <div className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.id}
                className="p-6 hover:bg-muted dark:hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getSeverityColor(entry.severity)
                    )}>
                      {entry.severity}
                    </span>
                    
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground dark:text-white mb-1">
                        {entry.action} on {entry.resource}
                      </h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground dark:text-muted-foreground">
                        <span>{entry.user.name}</span>
                        <span>•</span>
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span className="font-mono text-xs">{entry.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Stagger>

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <FadeIn>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">
              No audit entries found
            </h3>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        </FadeIn>
      )}
    </div>
  );
};

export default AuditLog;