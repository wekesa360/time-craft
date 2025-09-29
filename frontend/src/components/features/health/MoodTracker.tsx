import React, { useState } from 'react';
import type { MoodData } from '../../../types';
import { Sheet } from '../../ui/Sheet';

interface MoodTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MoodData) => void;
}

const moodLevels = [
  { value: 1, label: 'Terrible', color: 'text-red-600' },
  { value: 2, label: 'Bad', color: 'text-red-500' },
  { value: 3, label: 'Poor', color: 'text-orange-500' },
  { value: 4, label: 'Okay', color: 'text-yellow-500' },
  { value: 5, label: 'Fine', color: 'text-yellow-400' },
  { value: 6, label: 'Good', color: 'text-green-400' },
  { value: 7, label: 'Great', color: 'text-green-500' },
  { value: 8, label: 'Excellent', color: 'text-green-600' },
  { value: 9, label: 'Amazing', color: 'text-blue-500' },
  { value: 10, label: 'Fantastic', color: 'text-purple-500' }
];

const energyLevels = [
  { value: 1, label: 'Exhausted', description: 'No energy at all' },
  { value: 2, label: 'Very Low', description: 'Barely functioning' },
  { value: 3, label: 'Low', description: 'Sluggish and tired' },
  { value: 4, label: 'Below Average', description: 'A bit tired' },
  { value: 5, label: 'Average', description: 'Normal energy' },
  { value: 6, label: 'Above Average', description: 'Feeling good' },
  { value: 7, label: 'High', description: 'Energetic' },
  { value: 8, label: 'Very High', description: 'Very energetic' },
  { value: 9, label: 'Excellent', description: 'Full of energy' },
  { value: 10, label: 'Peak', description: 'Unstoppable energy' }
];

const stressLevels = [
  { value: 1, label: 'Completely Calm', color: 'bg-green-100 text-green-800' },
  { value: 2, label: 'Very Relaxed', color: 'bg-green-100 text-green-800' },
  { value: 3, label: 'Relaxed', color: 'bg-green-100 text-green-800' },
  { value: 4, label: 'Slightly Tense', color: 'bg-yellow-100 text-yellow-800' },
  { value: 5, label: 'Moderate Stress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 6, label: 'Stressed', color: 'bg-orange-100 text-orange-800' },
  { value: 7, label: 'Very Stressed', color: 'bg-orange-100 text-orange-800' },
  { value: 8, label: 'Highly Stressed', color: 'bg-red-100 text-red-800' },
  { value: 9, label: 'Extremely Stressed', color: 'bg-red-100 text-red-800' },
  { value: 10, label: 'Overwhelmed', color: 'bg-red-100 text-red-800' }
];

const sleepQuality = [
  { value: 1, label: 'Terrible', description: 'No sleep or very poor' },
  { value: 2, label: 'Very Poor', description: 'Restless, frequent waking' },
  { value: 3, label: 'Poor', description: 'Difficulty falling asleep' },
  { value: 4, label: 'Below Average', description: 'Some sleep issues' },
  { value: 5, label: 'Average', description: 'Okay sleep' },
  { value: 6, label: 'Above Average', description: 'Good sleep' },
  { value: 7, label: 'Good', description: 'Restful sleep' },
  { value: 8, label: 'Very Good', description: 'Deep, refreshing sleep' },
  { value: 9, label: 'Excellent', description: 'Perfect sleep' },
  { value: 10, label: 'Perfect', description: 'Best sleep ever' }
];

const commonTags = [
  'happy', 'sad', 'anxious', 'excited', 'tired', 'energetic', 'calm', 'stressed',
  'productive', 'creative', 'focused', 'distracted', 'motivated', 'overwhelmed',
  'grateful', 'frustrated', 'confident', 'worried', 'relaxed', 'content'
];

const MoodTracker: React.FC<MoodTrackerProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<MoodData>({
    score: 5,
    energy: 5,
    stress: 3,
    sleep: 5,
    notes: '',
    tags: []
  });

  const [customTag, setCustomTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedMood = moodLevels.find(mood => mood.value === formData.score);
  const selectedEnergy = energyLevels.find(energy => energy.value === formData.energy);
  const selectedStress = stressLevels.find(stress => stress.value === formData.stress);
  const selectedSleep = sleepQuality.find(sleep => sleep.value === (formData.sleep || 5));

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.score < 1 || formData.score > 10) {
      newErrors.score = 'Mood score must be between 1 and 10';
    }

    if (formData.energy < 1 || formData.energy > 10) {
      newErrors.energy = 'Energy level must be between 1 and 10';
    }

    if (formData.stress < 1 || formData.stress > 10) {
      newErrors.stress = 'Stress level must be between 1 and 10';
    }

    if (formData.sleep && (formData.sleep < 1 || formData.sleep > 10)) {
      newErrors.sleep = 'Sleep quality must be between 1 and 10';
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes must be less than 500 characters';
    }

    if (formData.tags && formData.tags.length > 10) {
      newErrors.tags = 'Maximum 10 tags allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags?.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tag]
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const addCustomTag = () => {
    if (customTag.trim()) {
      addTag(customTag.trim().toLowerCase());
      setCustomTag('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSave(formData);
    
    // Reset form
    setFormData({
      score: 5,
      energy: 5,
      stress: 3,
      sleep: 5,
      notes: '',
      tags: []
    });
    setCustomTag('');
    setErrors({});
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Track Mood"
      className="p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood Score */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-4">
              How are you feeling right now?
            </label>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {moodLevels.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, score: mood.value })}
                  className={`btn ${formData.score === mood.value ? 'btn-primary' : 'btn-secondary'} w-full`}
                >
                  <div className="text-xs font-medium">{mood.value}</div>
                </button>
              ))}
            </div>
            {selectedMood && (
              <div className="mt-3 text-center">
                <span className={`text-lg font-medium ${selectedMood.color}`}>
                  {selectedMood.label} ({selectedMood.value}/10)
                </span>
              </div>
            )}
          </div>

          {/* Energy Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Energy Level: {formData.energy}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.energy}
              onChange={(e) => setFormData({ ...formData, energy: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            {selectedEnergy && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-foreground-secondary">
                  {selectedEnergy.label}
                </span>
                <span className="text-foreground-secondary">
                  {selectedEnergy.description}
                </span>
              </div>
            )}
          </div>

          {/* Stress Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Stress Level: {formData.stress}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.stress}
              onChange={(e) => setFormData({ ...formData, stress: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            {selectedStress && (
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedStress.color}`}>
                  {selectedStress.label}
                </span>
              </div>
            )}
          </div>

          {/* Sleep Quality */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Sleep Quality (last night): {formData.sleep}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.sleep || 5}
              onChange={(e) => setFormData({ ...formData, sleep: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            {selectedSleep && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">
                  {selectedSleep.label}
                </span>
                <span className="text-foreground-secondary">
                  {selectedSleep.description}
                </span>
              </div>
            )}
          </div>

          {/* Mood Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              How would you describe your mood? (Select all that apply)
            </label>
            
            {/* Selected Tags */}
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Common Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {commonTags.filter(tag => !formData.tags?.includes(tag)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="px-3 py-1 text-sm border border-border rounded-full hover:bg-background-secondary transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                className="input flex-1"
                placeholder="Add custom mood tag..."
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="btn-outline"
                disabled={!customTag.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input w-full h-24 resize-none"
              placeholder="What's on your mind? Any thoughts about your mood today..."
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
              Log Mood
            </button>
          </div>
      </form>
    </Sheet>
  );
};

export default MoodTracker;