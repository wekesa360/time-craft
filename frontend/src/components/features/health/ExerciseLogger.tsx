import React, { useState } from 'react';
import type { ExerciseData } from '../../../types';
import { Sheet } from '../../ui/Sheet';

interface ExerciseLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExerciseData) => void;
}

const activityTypes = [
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'walking', label: 'Walking' },
  { value: 'weightlifting', label: 'Weight Lifting' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'dancing', label: 'Dancing' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'other', label: 'Other' }
];

const intensityLevels = [
  { value: 1, label: 'Very Light', description: 'Minimal effort', color: 'bg-gray-100 text-gray-800' },
  { value: 2, label: 'Light', description: 'Easy pace', color: 'bg-green-100 text-green-800' },
  { value: 3, label: 'Light-Moderate', description: 'Comfortable', color: 'bg-green-100 text-green-800' },
  { value: 4, label: 'Moderate', description: 'Some effort', color: 'bg-yellow-100 text-yellow-800' },
  { value: 5, label: 'Moderate-Hard', description: 'Noticeable effort', color: 'bg-yellow-100 text-yellow-800' },
  { value: 6, label: 'Hard', description: 'Vigorous', color: 'bg-orange-100 text-orange-800' },
  { value: 7, label: 'Very Hard', description: 'Very vigorous', color: 'bg-orange-100 text-orange-800' },
  { value: 8, label: 'Extremely Hard', description: 'Maximal effort', color: 'bg-red-100 text-red-800' },
  { value: 9, label: 'Maximum', description: 'All-out effort', color: 'bg-red-100 text-red-800' },
  { value: 10, label: 'Absolute Maximum', description: 'Peak performance', color: 'bg-red-100 text-red-800' }
];

const ExerciseLogger: React.FC<ExerciseLoggerProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<ExerciseData>({
    activity: '',
    durationMinutes: 0,
    intensity: 5,
    caloriesBurned: undefined,
    distance: undefined,
    heartRateAvg: undefined,
    heartRateMax: undefined,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.activity) {
      newErrors.activity = 'Activity type is required';
    }

    if (!formData.durationMinutes || formData.durationMinutes <= 0) {
      newErrors.durationMinutes = 'Duration must be greater than 0';
    }

    if (formData.heartRateAvg && (formData.heartRateAvg < 40 || formData.heartRateAvg > 220)) {
      newErrors.heartRateAvg = 'Average heart rate should be between 40-220 bpm';
    }

    if (formData.heartRateMax && (formData.heartRateMax < 40 || formData.heartRateMax > 220)) {
      newErrors.heartRateMax = 'Max heart rate should be between 40-220 bpm';
    }

    if (formData.heartRateAvg && formData.heartRateMax && formData.heartRateAvg > formData.heartRateMax) {
      newErrors.heartRateMax = 'Max heart rate should be higher than average';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSave(formData);
    
    // Reset form
    setFormData({
      activity: '',
      durationMinutes: 0,
      intensity: 5,
      caloriesBurned: undefined,
      distance: undefined,
      heartRateAvg: undefined,
      heartRateMax: undefined,
      notes: ''
    });
    setErrors({});
  };

  const selectedIntensity = intensityLevels.find(level => level.value === formData.intensity);

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Log Exercise"
      className="p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Activity Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {activityTypes.map((activity) => (
                <button
                  key={activity.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, activity: activity.value })}
                  className={`btn ${formData.activity === activity.value ? 'btn-primary' : 'btn-secondary'} w-full`}
                >
                  {activity.label}
                </button>
              ))}
            </div>
            {errors.activity && (
              <p className="text-red-500 text-sm mt-1">{errors.activity}</p>
            )}
          </div>

          {/* Duration and Intensity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.durationMinutes || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  durationMinutes: e.target.value ? Number(e.target.value) : 0 
                })}
                className={`input w-full ${errors.durationMinutes ? 'border-red-500' : ''}`}
                placeholder="e.g., 30"
              />
              {errors.durationMinutes && (
                <p className="text-red-500 text-sm mt-1">{errors.durationMinutes}</p>
              )}
            </div>

            {/* Intensity */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Exercise Intensity
              </label>
              
              {/* Intensity Slider */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground-secondary">Very Light</span>
                  <span className="text-lg font-semibold text-foreground">{formData.intensity}/10</span>
                  <span className="text-sm text-foreground-secondary">Maximum</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.intensity}
                  onChange={(e) => setFormData({ ...formData, intensity: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)`
                  }}
                />
              </div>

              {/* Intensity Display Card */}
              {selectedIntensity && (
                <div className="bg-background-secondary rounded-lg p-4 border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-foreground mb-1">
                        {selectedIntensity.label}
                      </h4>
                      <p className="text-sm text-foreground-secondary">
                        {selectedIntensity.description}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${selectedIntensity.color}`}>
                      Level {selectedIntensity.value}
                    </div>
                  </div>
                  
                  {/* Intensity Scale Indicator */}
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded-full ${
                          level <= formData.intensity
                            ? level <= 3
                              ? 'bg-green-400'
                              : level <= 6
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calories */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Calories Burned
              </label>
              <input
                type="number"
                min="0"
                value={formData.caloriesBurned || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  caloriesBurned: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="input w-full"
                placeholder="e.g., 300"
              />
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Distance (km)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.distance || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  distance: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="input w-full"
                placeholder="e.g., 5.2"
              />
            </div>
          </div>

          {/* Heart Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Heart Rate */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Average Heart Rate (bpm)
              </label>
              <input
                type="number"
                min="40"
                max="220"
                value={formData.heartRateAvg || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  heartRateAvg: e.target.value ? Number(e.target.value) : undefined 
                })}
                className={`input w-full ${errors.heartRateAvg ? 'border-red-500' : ''}`}
                placeholder="e.g., 140"
              />
              {errors.heartRateAvg && (
                <p className="text-red-500 text-sm mt-1">{errors.heartRateAvg}</p>
              )}
            </div>

            {/* Max Heart Rate */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Heart Rate (bpm)
              </label>
              <input
                type="number"
                min="40"
                max="220"
                value={formData.heartRateMax || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  heartRateMax: e.target.value ? Number(e.target.value) : undefined 
                })}
                className={`input w-full ${errors.heartRateMax ? 'border-red-500' : ''}`}
                placeholder="e.g., 165"
              />
              {errors.heartRateMax && (
                <p className="text-red-500 text-sm mt-1">{errors.heartRateMax}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input w-full h-24 resize-none"
              placeholder="How did the workout feel? Any observations..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Log Exercise
            </button>
          </div>
      </form>
    </Sheet>
  );
};

export default ExerciseLogger;