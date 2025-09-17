import React, { useState } from 'react';
import { ExerciseData } from '../../../types';
import { 
  Activity, 
  Clock, 
  Zap, 
  Flame, 
  MapPin, 
  Heart,
  Save,
  X
} from 'lucide-react';

interface ExerciseLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExerciseData) => void;
}

const activityTypes = [
  { value: 'running', label: 'Running', icon: '🏃‍♂️' },
  { value: 'cycling', label: 'Cycling', icon: '🚴‍♂️' },
  { value: 'swimming', label: 'Swimming', icon: '🏊‍♂️' },
  { value: 'walking', label: 'Walking', icon: '🚶‍♂️' },
  { value: 'weightlifting', label: 'Weight Lifting', icon: '🏋️‍♂️' },
  { value: 'yoga', label: 'Yoga', icon: '🧘‍♀️' },
  { value: 'pilates', label: 'Pilates', icon: '🤸‍♀️' },
  { value: 'dancing', label: 'Dancing', icon: '💃' },
  { value: 'hiking', label: 'Hiking', icon: '🥾' },
  { value: 'tennis', label: 'Tennis', icon: '🎾' },
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'soccer', label: 'Soccer', icon: '⚽' },
  { value: 'other', label: 'Other', icon: '🏃‍♂️' }
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

export const ExerciseLogger: React.FC<ExerciseLoggerProps> = ({
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-foreground">Log Exercise</h2>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.activity === activity.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                      : 'border-border hover:border-orange-300 hover:bg-background-secondary'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{activity.icon}</span>
                    <span className="text-sm font-medium text-foreground">{activity.label}</span>
                  </div>
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
                <Clock className="w-4 h-4 inline mr-1" />
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
              <label className="block text-sm font-medium text-foreground mb-2">
                <Zap className="w-4 h-4 inline mr-1" />
                Intensity: {formData.intensity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.intensity}
                onChange={(e) => setFormData({ ...formData, intensity: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              {selectedIntensity && (
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedIntensity.color}`}>
                    {selectedIntensity.label} - {selectedIntensity.description}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Optional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calories */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Flame className="w-4 h-4 inline mr-1" />
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
                <MapPin className="w-4 h-4 inline mr-1" />
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
                <Heart className="w-4 h-4 inline mr-1" />
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
                <Heart className="w-4 h-4 inline mr-1" />
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
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              Log Exercise
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};