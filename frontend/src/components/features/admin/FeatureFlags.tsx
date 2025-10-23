/**
 * Feature Flags Component
 * A/B testing and feature rollout management
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { Button } from '../../ui';
import { FadeIn, Stagger } from '../../ui/animations';

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environment: 'development' | 'staging' | 'production';
  targetAudience: 'all' | 'beta' | 'premium' | 'admin';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  conditions?: {
    userRole?: string[];
    subscription?: string[];
    country?: string[];
  };
}

interface FeatureFlagsProps {
  className?: string;
}

const FeatureFlags: React.FC<FeatureFlagsProps> = ({ className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnvironment, setFilterEnvironment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);

  // Mock data - in real app, this would come from API
  const [flags, setFlags] = useState<FeatureFlag[]>([
    {
      id: '1',
      name: 'New Dashboard',
      key: 'new_dashboard',
      description: 'Enable the redesigned dashboard interface with improved analytics',
      enabled: true,
      rolloutPercentage: 25,
      environment: 'production',
      targetAudience: 'beta',
      createdAt: '2024-01-15',
      updatedAt: '2024-02-10',
      createdBy: 'admin@example.com',
      tags: ['ui', 'dashboard', 'analytics'],
      conditions: {
        subscription: ['premium', 'student'],
      },
    },
    {
      id: '2',
      name: 'AI Recommendations',
      key: 'ai_recommendations',
      description: 'Show AI-powered task and health recommendations',
      enabled: false,
      rolloutPercentage: 0,
      environment: 'staging',
      targetAudience: 'all',
      createdAt: '2024-02-01',
      updatedAt: '2024-02-08',
      createdBy: 'dev@example.com',
      tags: ['ai', 'recommendations', 'experimental'],
    },
    {
      id: '3',
      name: 'Voice Commands',
      key: 'voice_commands',
      description: 'Enable voice command processing for task management',
      enabled: true,
      rolloutPercentage: 100,
      environment: 'production',
      targetAudience: 'premium',
      createdAt: '2024-01-20',
      updatedAt: '2024-02-05',
      createdBy: 'product@example.com',
      tags: ['voice', 'accessibility', 'premium'],
      conditions: {
        subscription: ['premium'],
      },
    },
    {
      id: '4',
      name: 'Dark Mode',
      key: 'dark_mode',
      description: 'Enable dark theme option for all users',
      enabled: true,
      rolloutPercentage: 100,
      environment: 'production',
      targetAudience: 'all',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-25',
      createdBy: 'design@example.com',
      tags: ['ui', 'theme', 'accessibility'],
    },
  ]);

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesEnvironment = filterEnvironment === 'all' || flag.environment === filterEnvironment;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'enabled' && flag.enabled) ||
                         (filterStatus === 'disabled' && !flag.enabled);
    
    return matchesSearch && matchesEnvironment && matchesStatus;
  });

  const toggleFlag = (flagId: string) => {
    setFlags(prev => prev.map(flag => 
      flag.id === flagId 
        ? { ...flag, enabled: !flag.enabled, updatedAt: new Date().toISOString().split('T')[0] }
        : flag
    ));
  };

  const updateRollout = (flagId: string, percentage: number) => {
    setFlags(prev => prev.map(flag => 
      flag.id === flagId 
        ? { ...flag, rolloutPercentage: percentage, updatedAt: new Date().toISOString().split('T')[0] }
        : flag
    ));
  };

  const getEnvironmentColor = (environment: FeatureFlag['environment']) => {
    switch (environment) {
      case 'production':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'development':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getAudienceColor = (audience: FeatureFlag['targetAudience']) => {
    switch (audience) {
      case 'all':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'beta':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'premium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Feature Flags
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage feature rollouts and A/B testing
            </p>
          </div>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Flag
          </Button>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search flags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Environment Filter */}
            <select
              value={filterEnvironment}
              onChange={(e) => setFilterEnvironment(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Environments</option>
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </FadeIn>

      {/* Feature Flags List */}
      <Stagger stagger={0.1} direction="up">
        <div className="space-y-4">
          {filteredFlags.map((flag) => (
            <motion.div
              key={flag.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {flag.name}
                    </h3>
                    
                    {/* Status Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={flag.enabled}
                        onChange={() => toggleFlag(flag.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                    
                    {/* Environment Badge */}
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getEnvironmentColor(flag.environment)
                    )}>
                      {flag.environment}
                    </span>
                    
                    {/* Audience Badge */}
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getAudienceColor(flag.targetAudience)
                    )}>
                      {flag.targetAudience}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {flag.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Key: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">{flag.key}</code></span>
                    <span>Created: {new Date(flag.createdAt).toLocaleDateString()}</span>
                    <span>By: {flag.createdBy}</span>
                  </div>
                  
                  {/* Tags */}
                  {flag.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {flag.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="ml-6 flex flex-col items-end space-y-3">
                  {/* Rollout Percentage */}
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Rollout: {flag.rolloutPercentage}%
                    </div>
                    <div className="w-32">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={flag.rolloutPercentage}
                        onChange={(e) => updateRollout(flag.id, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        disabled={!flag.enabled}
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => {
                        setEditingFlag(flag);
                        setShowCreateModal(true);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        // TODO: Implement delete flag
                        console.log('Delete flag:', flag.id);
                      }}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Conditions */}
              {flag.conditions && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Conditions:</strong>
                    {flag.conditions.subscription && (
                      <span className="ml-2">
                        Subscription: {flag.conditions.subscription.join(', ')}
                      </span>
                    )}
                    {flag.conditions.userRole && (
                      <span className="ml-2">
                        Role: {flag.conditions.userRole.join(', ')}
                      </span>
                    )}
                    {flag.conditions.country && (
                      <span className="ml-2">
                        Country: {flag.conditions.country.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Stagger>

      {/* Empty State */}
      {filteredFlags.length === 0 && (
        <FadeIn>
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No feature flags found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        </FadeIn>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingFlag ? 'Edit Feature Flag' : 'Create New Feature Flag'}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      defaultValue={editingFlag?.name || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Key
                    </label>
                    <input
                      type="text"
                      defaultValue={editingFlag?.key || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    defaultValue={editingFlag?.description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Environment
                    </label>
                    <select
                      defaultValue={editingFlag?.environment || 'development'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="development">Development</option>
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Audience
                    </label>
                    <select
                      defaultValue={editingFlag?.targetAudience || 'all'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">All Users</option>
                      <option value="beta">Beta Users</option>
                      <option value="premium">Premium Users</option>
                      <option value="admin">Admin Users</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rollout %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={editingFlag?.rolloutPercentage || 0}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    defaultValue={editingFlag?.tags.join(', ') || ''}
                    placeholder="ui, experimental, beta"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingFlag(null);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Implement save flag
                    setShowCreateModal(false);
                    setEditingFlag(null);
                  }}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  {editingFlag ? 'Update' : 'Create'} Flag
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeatureFlags;