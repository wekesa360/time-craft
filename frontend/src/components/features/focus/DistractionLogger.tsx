/**
 * Distraction Logger Component
 * Track interruptions during focus sessions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { Button } from '../../ui';
import { FadeIn, ScaleIn } from '../../ui/animations';

interface Distraction {
  id: string;
  timestamp: number;
  type: 'internal' | 'external' | 'digital' | 'environmental';
  description?: string;
  severity: 1 | 2 | 3; // 1 = minor, 2 = moderate, 3 = major
  duration?: number; // in seconds
}

interface DistractionLoggerProps {
  sessionId: string;
  isSessionActive: boolean;
  onDistractionLogged?: (distraction: Distraction) => void;
  onDistractionRemoved?: (distractionId: string) => void;
  className?: string;
}

const distractionTypes = [
  {
    type: 'internal' as const,
    label: 'Internal',
    description: 'Mind wandering, daydreaming',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'purple',
  },
  {
    type: 'external' as const,
    label: 'External',
    description: 'People, conversations, interruptions',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'blue',
  },
  {
    type: 'digital' as const,
    label: 'Digital',
    description: 'Notifications, social media, websites',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: 'red',
  },
  {
    type: 'environmental' as const,
    label: 'Environmental',
    description: 'Noise, temperature, lighting',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'green',
  },
];

const severityLevels = [
  { level: 1, label: 'Minor', description: 'Quick glance, easily refocused', color: 'green' },
  { level: 2, label: 'Moderate', description: 'Brief interruption, some effort to refocus', color: 'yellow' },
  { level: 3, label: 'Major', description: 'Significant disruption, hard to refocus', color: 'red' },
];

const DistractionLogger: React.FC<DistractionLoggerProps> = ({
  sessionId,
  isSessionActive,
  onDistractionLogged,
  onDistractionRemoved,
  className,
}) => {
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [showLogger, setShowLogger] = useState(false);
  const [selectedType, setSelectedType] = useState<Distraction['type'] | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<Distraction['severity']>(1);
  const [description, setDescription] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  // Reset when session changes
  useEffect(() => {
    setDistractions([]);
    setShowLogger(false);
    setSelectedType(null);
    setDescription('');
  }, [sessionId]);

  const logDistraction = (type: Distraction['type'], severity: Distraction['severity'], desc?: string) => {
    const distraction: Distraction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      severity,
      description: desc || undefined,
    };

    setDistractions(prev => [...prev, distraction]);
    onDistractionLogged?.(distraction);
    
    // Reset form
    setSelectedType(null);
    setSelectedSeverity(1);
    setDescription('');
    setShowLogger(false);
  };

  const removeDistraction = (distractionId: string) => {
    setDistractions(prev => prev.filter(d => d.id !== distractionId));
    onDistractionRemoved?.(distractionId);
  };

  const quickLogDistraction = (type: Distraction['type']) => {
    setIsLogging(true);
    logDistraction(type, 1);
    
    // Show brief feedback
    setTimeout(() => setIsLogging(false), 1000);
  };

  const getTypeColor = (type: string) => {
    const typeConfig = distractionTypes.find(t => t.type === type);
    return typeConfig?.color || 'gray';
  };

  const getSeverityColor = (severity: number) => {
    const severityConfig = severityLevels.find(s => s.level === severity);
    return severityConfig?.color || 'gray';
  };

  const colorClasses = {
    purple: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    blue: 'bg-info-light text-info border-blue-200 dark:bg-info/20 dark:text-info-light dark:border-blue-800',
    red: 'bg-error-light text-error border-red-200 dark:bg-error/20 dark:text-error-light dark:border-red-800',
    green: 'bg-success-light text-success border-green-200 dark:bg-success/20 dark:text-success-light dark:border-green-800',
    yellow: 'bg-warning-light text-warning border-yellow-200 dark:bg-warning/20 dark:text-warning-light dark:border-yellow-800',
    gray: 'bg-muted text-muted-foreground border-gray-200 dark:bg-muted/20 dark:text-muted-foreground dark:border-gray-800',
  };

  if (!isSessionActive) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Quick Log Buttons */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground dark:text-white">
            Distraction Tracker
          </h3>
          <div className="flex items-center space-x-2">
            {distractionTypes.map((type) => (
              <Button
                key={type.type}
                onClick={() => quickLogDistraction(type.type)}
                size="sm"
                variant="outline"
                className={cn(
                  'p-2 transition-all duration-200',
                  isLogging ? 'animate-pulse' : 'hover:scale-105'
                )}
                title={`Quick log ${type.label.toLowerCase()} distraction`}
              >
                {type.icon}
              </Button>
            ))}
            <Button
              onClick={() => setShowLogger(!showLogger)}
              size="sm"
              variant="outline"
              className="ml-2"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Detailed
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Detailed Logger */}
      <AnimatePresence>
        {showLogger && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4"
          >
            <h4 className="font-medium text-foreground dark:text-white">Log Distraction</h4>
            
            {/* Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                Type of Distraction
              </label>
              <div className="grid grid-cols-2 gap-2">
                {distractionTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => setSelectedType(type.type)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all duration-200',
                      selectedType === type.type
                        ? colorClasses[type.color as keyof typeof colorClasses]
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {type.icon}
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="text-xs opacity-75">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Selection */}
            {selectedType && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Severity Level
                </label>
                <div className="flex space-x-2">
                  {severityLevels.map((severity) => (
                    <button
                      key={severity.level}
                      onClick={() => setSelectedSeverity(severity.level as Distraction['severity'])}
                      className={cn(
                        'flex-1 p-2 rounded-lg border text-center transition-all duration-200',
                        selectedSeverity === severity.level
                          ? colorClasses[severity.color as keyof typeof colorClasses]
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      )}
                    >
                      <div className="font-medium text-sm">{severity.label}</div>
                      <div className="text-xs opacity-75">{severity.description}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Description */}
            {selectedType && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What caused the distraction?"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white resize-none"
                  rows={2}
                />
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              <Button
                onClick={() => setShowLogger(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedType && logDistraction(selectedType, selectedSeverity, description)}
                disabled={!selectedType}
                size="sm"
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Log Distraction
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Distraction List */}
      {distractions.length > 0 && (
        <FadeIn delay={0.2}>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground dark:text-white">
              Session Distractions ({distractions.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {distractions.map((distraction, index) => {
                const typeConfig = distractionTypes.find(t => t.type === distraction.type);
                const severityConfig = severityLevels.find(s => s.level === distraction.severity);
                
                return (
                  <motion.div
                    key={distraction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-2 bg-muted dark:bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        'p-1 rounded',
                        colorClasses[getTypeColor(distraction.type) as keyof typeof colorClasses]
                      )}>
                        {typeConfig?.icon}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-foreground dark:text-white">
                            {typeConfig?.label}
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            colorClasses[getSeverityColor(distraction.severity) as keyof typeof colorClasses]
                          )}>
                            {severityConfig?.label}
                          </span>
                        </div>
                        {distraction.description && (
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                            {distraction.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {new Date(distraction.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => removeDistraction(distraction.id)}
                      size="sm"
                      variant="outline"
                      className="p-1 text-error hover:bg-error-light dark:hover:bg-error/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Session Summary */}
      {distractions.length > 0 && (
        <FadeIn delay={0.3}>
          <div className="bg-info-light dark:bg-info/20 rounded-lg border border-blue-200 dark:border-blue-800 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-info dark:text-info-light font-medium">
                Session Impact
              </span>
              <div className="flex items-center space-x-4 text-info dark:text-info-light">
                <span>
                  {distractions.length} interruption{distractions.length !== 1 ? 's' : ''}
                </span>
                <span>
                  Avg severity: {(distractions.reduce((sum, d) => sum + d.severity, 0) / distractions.length).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
};

export default DistractionLogger;