/**
 * Environment Tracker Component
 * Track workspace conditions for optimal focus sessions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { Button } from '../../ui';
import { FadeIn, ScaleIn } from '../../ui/animations';

interface EnvironmentData {
  id: string;
  timestamp: number;
  location: string;
  noiseLevel: 1 | 2 | 3 | 4 | 5; // 1 = very quiet, 5 = very noisy
  lighting: 1 | 2 | 3 | 4 | 5; // 1 = very dim, 5 = very bright
  temperature: 1 | 2 | 3 | 4 | 5; // 1 = very cold, 5 = very hot
  comfort: 1 | 2 | 3 | 4 | 5; // 1 = very uncomfortable, 5 = very comfortable
  distractions: string[];
  notes?: string;
  sessionProductivity?: number; // 1-5 rating from completed session
}

interface EnvironmentTrackerProps {
  onEnvironmentLogged?: (environment: EnvironmentData) => void;
  currentSessionId?: string;
  isSessionActive?: boolean;
  className?: string;
}

const locations = [
  { id: 'home-office', label: 'Home Office', icon: '🏠' },
  { id: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { id: 'living-room', label: 'Living Room', icon: '🛋️' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍽️' },
  { id: 'library', label: 'Library', icon: '📚' },
  { id: 'cafe', label: 'Café', icon: '☕' },
  { id: 'coworking', label: 'Coworking Space', icon: '💼' },
  { id: 'office', label: 'Office', icon: '🏢' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌳' },
  { id: 'other', label: 'Other', icon: '📍' },
];

const commonDistractions = [
  { id: 'noise-traffic', label: 'Traffic Noise', category: 'noise' },
  { id: 'noise-people', label: 'People Talking', category: 'noise' },
  { id: 'noise-construction', label: 'Construction', category: 'noise' },
  { id: 'noise-music', label: 'Background Music', category: 'noise' },
  { id: 'visual-movement', label: 'Visual Movement', category: 'visual' },
  { id: 'visual-clutter', label: 'Cluttered Space', category: 'visual' },
  { id: 'visual-screens', label: 'Other Screens', category: 'visual' },
  { id: 'temp-hot', label: 'Too Hot', category: 'comfort' },
  { id: 'temp-cold', label: 'Too Cold', category: 'comfort' },
  { id: 'lighting-dim', label: 'Too Dim', category: 'comfort' },
  { id: 'lighting-bright', label: 'Too Bright', category: 'comfort' },
  { id: 'seating-uncomfortable', label: 'Uncomfortable Seating', category: 'comfort' },
];

const scaleLabels = {
  noiseLevel: ['Very Quiet', 'Quiet', 'Moderate', 'Noisy', 'Very Noisy'],
  lighting: ['Very Dim', 'Dim', 'Moderate', 'Bright', 'Very Bright'],
  temperature: ['Very Cold', 'Cold', 'Comfortable', 'Warm', 'Very Hot'],
  comfort: ['Very Uncomfortable', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very Comfortable'],
};

const EnvironmentTracker: React.FC<EnvironmentTrackerProps> = ({
  onEnvironmentLogged,
  currentSessionId,
  isSessionActive,
  className,
}) => {
  const [showTracker, setShowTracker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [noiseLevel, setNoiseLevel] = useState<number>(3);
  const [lighting, setLighting] = useState<number>(3);
  const [temperature, setTemperature] = useState<number>(3);
  const [comfort, setComfort] = useState<number>(3);
  const [selectedDistractions, setSelectedDistractions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [environments, setEnvironments] = useState<EnvironmentData[]>([]);

  // Auto-detect environment if possible (placeholder for future implementation)
  useEffect(() => {
    // Could integrate with device sensors, geolocation, etc.
    // For now, we'll rely on manual input
  }, []);

  const resetForm = () => {
    setSelectedLocation('');
    setCustomLocation('');
    setNoiseLevel(3);
    setLighting(3);
    setTemperature(3);
    setComfort(3);
    setSelectedDistractions([]);
    setNotes('');
  };

  const logEnvironment = () => {
    const location = selectedLocation === 'other' ? customLocation : 
                    locations.find(l => l.id === selectedLocation)?.label || '';
    
    if (!location) return;

    const environment: EnvironmentData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      location,
      noiseLevel: noiseLevel as EnvironmentData['noiseLevel'],
      lighting: lighting as EnvironmentData['lighting'],
      temperature: temperature as EnvironmentData['temperature'],
      comfort: comfort as EnvironmentData['comfort'],
      distractions: selectedDistractions,
      notes: notes || undefined,
    };

    setEnvironments(prev => [...prev, environment]);
    onEnvironmentLogged?.(environment);
    
    resetForm();
    setShowTracker(false);
  };

  const toggleDistraction = (distractionId: string) => {
    setSelectedDistractions(prev => 
      prev.includes(distractionId)
        ? prev.filter(id => id !== distractionId)
        : [...prev, distractionId]
    );
  };

  const getEnvironmentScore = (env: EnvironmentData) => {
    // Calculate a simple environment score (higher is better)
    const noiseScore = 6 - env.noiseLevel; // Quieter is better
    const lightingScore = env.lighting; // Moderate to bright is good
    const tempScore = env.temperature === 3 ? 5 : Math.abs(env.temperature - 3) + 1; // Comfortable temp is best
    const comfortScore = env.comfort;
    const distractionPenalty = env.distractions.length * 0.5;
    
    return Math.max(1, Math.min(5, (noiseScore + lightingScore + tempScore + comfortScore) / 4 - distractionPenalty));
  };

  const getBestEnvironments = () => {
    return environments
      .filter(env => env.sessionProductivity !== undefined)
      .sort((a, b) => (b.sessionProductivity || 0) - (a.sessionProductivity || 0))
      .slice(0, 3);
  };

  const getScaleColor = (value: number, scale: keyof typeof scaleLabels) => {
    if (scale === 'noiseLevel') {
      return value <= 2 ? 'green' : value <= 3 ? 'yellow' : 'red';
    }
    if (scale === 'temperature') {
      return value === 3 ? 'green' : Math.abs(value - 3) === 1 ? 'yellow' : 'red';
    }
    return value >= 4 ? 'green' : value >= 3 ? 'yellow' : 'red';
  };

  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    red: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Environment Tracker
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Track your workspace conditions for optimal focus
            </p>
          </div>
          <Button
            onClick={() => setShowTracker(!showTracker)}
            size="sm"
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log Environment
          </Button>
        </div>
      </FadeIn>

      {/* Environment Logger */}
      <AnimatePresence>
        {showTracker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6"
          >
            <h4 className="font-medium text-gray-900 dark:text-white">Current Environment</h4>
            
            {/* Location Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {locations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location.id)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all duration-200',
                      selectedLocation === location.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{location.icon}</span>
                      <span className="text-sm font-medium">{location.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              {selectedLocation === 'other' && (
                <motion.input
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Enter custom location"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              )}
            </div>

            {/* Environment Scales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(scaleLabels).map(([scale, labels]) => (
                <div key={scale} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {scale.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{labels[0]}</span>
                      <span>{labels[4]}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={
                        scale === 'noiseLevel' ? noiseLevel :
                        scale === 'lighting' ? lighting :
                        scale === 'temperature' ? temperature :
                        comfort
                      }
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (scale === 'noiseLevel') setNoiseLevel(value);
                        else if (scale === 'lighting') setLighting(value);
                        else if (scale === 'temperature') setTemperature(value);
                        else setComfort(value);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className={cn(
                      'text-center text-sm px-2 py-1 rounded border',
                      colorClasses[getScaleColor(
                        scale === 'noiseLevel' ? noiseLevel :
                        scale === 'lighting' ? lighting :
                        scale === 'temperature' ? temperature :
                        comfort,
                        scale as keyof typeof scaleLabels
                      )]
                    )}>
                      {labels[
                        (scale === 'noiseLevel' ? noiseLevel :
                         scale === 'lighting' ? lighting :
                         scale === 'temperature' ? temperature :
                         comfort) - 1
                      ]}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Distractions */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Distractions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonDistractions.map((distraction) => (
                  <button
                    key={distraction.id}
                    onClick={() => toggleDistraction(distraction.id)}
                    className={cn(
                      'p-2 rounded-lg border text-sm transition-all duration-200',
                      selectedDistractions.includes(distraction.id)
                        ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    )}
                  >
                    {distraction.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any other environmental factors or observations..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <Button
                onClick={() => setShowTracker(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={logEnvironment}
                disabled={!selectedLocation || (selectedLocation === 'other' && !customLocation)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Log Environment
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Environment Insights */}
      {environments.length > 0 && (
        <FadeIn delay={0.2}>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              Environment Insights
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Environments */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recent Environments
                </h5>
                <div className="space-y-2">
                  {environments.slice(-3).reverse().map((env) => (
                    <div
                      key={env.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {env.location}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(env.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className={cn(
                          'px-2 py-1 rounded',
                          colorClasses[getScaleColor(env.noiseLevel, 'noiseLevel')]
                        )}>
                          Noise: {scaleLabels.noiseLevel[env.noiseLevel - 1]}
                        </span>
                        <span className={cn(
                          'px-2 py-1 rounded',
                          colorClasses[getScaleColor(env.comfort, 'comfort')]
                        )}>
                          Comfort: {env.comfort}/5
                        </span>
                      </div>
                      {env.distractions.length > 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {env.distractions.length} distraction{env.distractions.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Environments */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Optimization Tips
                </h5>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-800 dark:text-blue-200">
                      💡 Track your environment before each session to identify patterns that boost your productivity.
                    </p>
                  </div>
                  
                  {environments.some(env => env.noiseLevel >= 4) && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-yellow-800 dark:text-yellow-200">
                        🔇 Consider noise-canceling headphones or finding a quieter space.
                      </p>
                    </div>
                  )}
                  
                  {environments.some(env => env.distractions.length > 3) && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-orange-800 dark:text-orange-200">
                        🚫 Try to minimize distractions by preparing your space before starting.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
};

export default EnvironmentTracker;