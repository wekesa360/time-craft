import React, { useState } from 'react';
import type { Challenge } from '../../../types';
import { 
  X, 
  Target, 
  Calendar, 
  Users, 
  Lock, 
  Globe,
  Save,
  Plus,
  Activity,
  CheckSquare,
  Zap,
  Heart
} from 'lucide-react';

interface ChallengeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (challengeData: Omit<Challenge, 'id' | 'participants' | 'leaderboard' | 'isActive'>) => void;
}

const challengeTypes = [
  {
    value: 'exercise_streak',
    label: 'Exercise Streak',
    description: 'Complete exercise activities for consecutive days',
    icon: Activity,
    unit: 'days'
  },
  {
    value: 'task_completion',
    label: 'Task Completion',
    description: 'Complete a certain number of tasks',
    icon: CheckSquare,
    unit: 'tasks'
  },
  {
    value: 'focus_time',
    label: 'Focus Time',
    description: 'Accumulate total focus session time',
    icon: Zap,
    unit: 'minutes'
  },
  {
    value: 'health_logging',
    label: 'Health Logging',
    description: 'Log health activities consistently',
    icon: Heart,
    unit: 'logs'
  }
];

export const ChallengeCreator: React.FC<ChallengeCreatorProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'exercise_streak' as Challenge['type'],
    targetValue: 7,
    startDate: '',
    endDate: '',
    isPublic: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedType = challengeTypes.find(type => type.value === formData.type);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Challenge title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Challenge description is required';
    }

    if (!formData.targetValue || formData.targetValue <= 0) {
      newErrors.targetValue = 'Target value must be greater than 0';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const now = new Date();

      if (startDate < now) {
        newErrors.startDate = 'Start date cannot be in the past';
      }

      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }

      const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (duration > 365) {
        newErrors.endDate = 'Challenge cannot be longer than 365 days';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const challengeData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      targetValue: formData.targetValue,
      startDate: new Date(formData.startDate).getTime(),
      endDate: new Date(formData.endDate).getTime(),
      isPublic: formData.isPublic,
      createdBy: 'current-user' // This would be set by the backend
    };

    onSave(challengeData);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      type: 'exercise_streak',
      targetValue: 7,
      startDate: '',
      endDate: '',
      isPublic: true
    });
    setErrors({});
  };

  const getDurationDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Blurry Background Overlay */}
      <div 
        className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Sheet Content */}
      <div className="relative bg-white dark:bg-muted rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-out">
        {/* Drag Handle (Mobile) */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="w-8 h-1 bg-muted dark:bg-muted rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-foreground dark:text-white">Create Challenge</h2>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Set up a new challenge for your community</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Challenge Type */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-3">
              Challenge Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {challengeTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value as any })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-info-light dark:bg-info/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 hover:bg-muted dark:hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        formData.type === type.value
                          ? 'bg-info-light dark:bg-info/30'
                          : 'bg-muted dark:bg-muted'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          formData.type === type.value
                            ? 'text-info dark:text-info'
                            : 'text-muted-foreground dark:text-muted-foreground'
                        }`} />
                      </div>
                      <h3 className="font-medium text-foreground dark:text-white">{type.label}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
              Challenge Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 text-foreground dark:text-white bg-white dark:bg-muted border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter a catchy challenge title..."
            />
            {errors.title && (
              <p className="text-error-light0 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full h-24 px-3 py-2 text-foreground dark:text-white bg-white dark:bg-muted border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Describe your challenge and motivate participants..."
            />
            {errors.description && (
              <p className="text-error-light0 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Target Value */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
              Target Goal *
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) || 0 })}
                className={`w-32 px-3 py-2 text-foreground dark:text-white bg-white dark:bg-muted border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.targetValue ? 'border-red-500' : ''}`}
              />
              <span className="text-muted-foreground dark:text-muted-foreground">
                {selectedType?.unit}
              </span>
            </div>
            {errors.targetValue && (
              <p className="text-error-light0 text-sm mt-1">{errors.targetValue}</p>
            )}
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
              Participants need to reach this goal to complete the challenge
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`w-full px-3 py-2 text-foreground dark:text-white bg-white dark:bg-muted border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.startDate ? 'border-red-500' : ''}`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.startDate && (
                <p className="text-error-light0 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`w-full px-3 py-2 text-foreground dark:text-white bg-white dark:bg-muted border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.endDate ? 'border-red-500' : ''}`}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
              {errors.endDate && (
                <p className="text-error-light0 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {getDurationDays() > 0 && (
            <div className="p-3 bg-info-light dark:bg-info/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-info dark:text-info-light">
                Challenge Duration: {getDurationDays()} days
              </p>
            </div>
          )}

          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-3">
              Privacy Setting
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: true })}
                  className="text-primary-600"
                />
                <div>
                  <span className="font-medium text-foreground dark:text-white">Public Challenge</span>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Anyone can discover and join this challenge</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={!formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: false })}
                  className="text-primary-600"
                />
                <div>
                  <span className="font-medium text-foreground dark:text-white">Private Challenge</span>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Only people you invite can join</p>
                </div>
              </label>
            </div>
          </div>

          {/* Challenge Preview */}
          <div className="p-4 bg-muted dark:bg-muted rounded-lg">
            <h4 className="font-medium text-foreground dark:text-white mb-2">Challenge Preview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                {selectedType && (
                  <div className="p-1 bg-info-light dark:bg-info/30 rounded">
                    <selectedType.icon className="w-4 h-4 text-info dark:text-info" />
                  </div>
                )}
                <span className="font-medium text-foreground dark:text-white">
                  {formData.title || 'Challenge Title'}
                </span>
              </div>
              <p className="text-muted-foreground dark:text-muted-foreground">
                {formData.description || 'Challenge description will appear here...'}
              </p>
              <div className="flex items-center space-x-4 text-muted-foreground dark:text-muted-foreground">
                <span>Goal: {formData.targetValue} {selectedType?.unit}</span>
                {getDurationDays() > 0 && <span>Duration: {getDurationDays()} days</span>}
                <span>{formData.isPublic ? 'Public' : 'Private'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground dark:text-muted-foreground bg-white dark:bg-muted border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-muted dark:hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-info hover:bg-info focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg transition-colors inline-flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Create Challenge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};