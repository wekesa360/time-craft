import React, { useState } from 'react';
import { Sheet } from '../../ui/Sheet';

interface GoalCreationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

const goalTypes = [
  { value: 'weight_loss', label: 'Weight Loss', description: 'Lose weight over time', unit: 'kg' },
  { value: 'weight_gain', label: 'Weight Gain', description: 'Gain healthy weight', unit: 'kg' },
  { value: 'muscle_gain', label: 'Muscle Gain', description: 'Build muscle mass', unit: 'kg' },
  { value: 'endurance', label: 'Endurance', description: 'Improve cardiovascular fitness', unit: 'minutes' },
  { value: 'strength', label: 'Strength', description: 'Increase physical strength', unit: 'kg' },
  { value: 'nutrition', label: 'Nutrition', description: 'Improve eating habits', unit: 'meals' },
  { value: 'hydration', label: 'Hydration', description: 'Drink more water', unit: 'ml' },
  { value: 'sleep', label: 'Sleep', description: 'Improve sleep quality', unit: 'hours' },
  { value: 'mood', label: 'Mood', description: 'Improve mental wellbeing', unit: 'rating' },
  { value: 'custom', label: 'Custom', description: 'Create your own goal', unit: 'units' }
];

const priorities = [
  { value: 1, label: 'Low', color: 'text-muted-foreground' },
  { value: 2, label: 'Medium', color: 'text-warning' },
  { value: 3, label: 'High', color: 'text-primary' },
  { value: 4, label: 'Very High', color: 'text-error-light0' },
  { value: 5, label: 'Critical', color: 'text-error' }
];

export const GoalCreationSheet: React.FC<GoalCreationSheetProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    goalType: 'weight_loss',
    title: '',
    description: '',
    targetValue: 0,
    targetUnit: 'kg',
    targetDate: '',
    priority: 3
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedGoalType = goalTypes.find(type => type.value === formData.goalType);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.targetValue || formData.targetValue <= 0) {
      newErrors.targetValue = 'Target value must be greater than 0';
    }

    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required';
    } else {
      const targetDate = new Date(formData.targetDate);
      const today = new Date();
      if (targetDate <= today) {
        newErrors.targetDate = 'Target date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const goalData = {
      goalType: formData.goalType,
      title: formData.title,
      description: formData.description || undefined,
      targetValue: formData.targetValue,
      targetUnit: formData.targetUnit,
      targetDate: new Date(formData.targetDate).getTime(),
      priority: formData.priority
    };

    onSave(goalData);
    
    // Reset form
    setFormData({
      goalType: 'weight_loss',
      title: '',
      description: '',
      targetValue: 0,
      targetUnit: 'kg',
      targetDate: '',
      priority: 3
    });
    setErrors({});
  };

  const handleGoalTypeChange = (goalType: string) => {
    const type = goalTypes.find(t => t.value === goalType);
    setFormData({ 
      ...formData, 
      goalType,
      targetUnit: type?.unit || 'units'
    });
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Create Health Goal">
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Goal Type */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Goal Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {goalTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleGoalTypeChange(type.value)}
                  className={`btn ${formData.goalType === type.value ? 'btn-primary' : 'btn-secondary'} w-full py-4 text-left`}
                >
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{type.label}</div>
                    <div className="text-xs text-foreground-secondary">{type.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Goal Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Lose 10kg in 3 months"
              className={`input w-full ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && (
              <p className="text-error-light0 text-sm">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your goal and why it's important to you..."
              className="input w-full h-24 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-foreground-secondary">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Target Value and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Target Value
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                className={`input w-full ${errors.targetValue ? 'border-red-500' : ''}`}
              />
              {errors.targetValue && (
                <p className="text-error-light0 text-sm">{errors.targetValue}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Unit
              </label>
              <input
                type="text"
                value={formData.targetUnit}
                onChange={(e) => setFormData({ ...formData, targetUnit: e.target.value })}
                className="input w-full"
                placeholder="kg, ml, hours..."
              />
            </div>
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Target Date
            </label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className={`input w-full ${errors.targetDate ? 'border-red-500' : ''}`}
            />
            {errors.targetDate && (
              <p className="text-error-light0 text-sm">{errors.targetDate}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Priority Level
            </label>
            <div className="grid grid-cols-5 gap-2">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: priority.value })}
                  className={`btn ${formData.priority === priority.value ? 'btn-primary' : 'btn-secondary'} w-full py-3`}
                >
                  <div className="space-y-1">
                    <div className={`font-medium ${priority.color}`}>
                      {priority.value}
                    </div>
                    <div className="text-xs text-foreground-secondary">
                      {priority.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-background-secondary rounded-lg p-6 border border-border">
            <h4 className="font-semibold text-foreground mb-4">Goal Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Type:</span>
                <span className="font-medium text-foreground">{selectedGoalType?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Target:</span>
                <span className="font-medium text-foreground">{formData.targetValue} {formData.targetUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Deadline:</span>
                <span className="font-medium text-foreground">
                  {formData.targetDate ? new Date(formData.targetDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-secondary">Priority:</span>
                <span className="font-medium text-foreground">
                  {priorities.find(p => p.value === formData.priority)?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary px-6 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary px-6 py-2"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </Sheet>
  );
};
