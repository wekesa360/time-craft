import React, { useState } from 'react';
import type { SleepData } from '../../../types';
import { Sheet } from '../../ui/Sheet';

interface SleepLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SleepData) => void;
}

const qualityLevels = [
  { value: 1, label: 'Very Poor', color: 'bg-error-light text-error' },
  { value: 2, label: 'Poor', color: 'bg-warning-light text-warning' },
  { value: 3, label: 'Fair', color: 'bg-info-light text-info' },
  { value: 4, label: 'Good', color: 'bg-success-light text-success' },
  { value: 5, label: 'Excellent', color: 'bg-primary-light text-primary' },
];

const durationPresets = [
  { hours: 6, minutes: 0, label: '6 hours' },
  { hours: 7, minutes: 0, label: '7 hours' },
  { hours: 8, minutes: 0, label: '8 hours' },
  { hours: 9, minutes: 0, label: '9 hours' },
];

export const SleepLogger: React.FC<SleepLoggerProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<SleepData>({
    durationMinutes: 420, // Default 7 hours
    quality: 3,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (formData.durationMinutes < 60 || formData.durationMinutes > 1440) {
      newErrors.durationMinutes = 'Sleep duration must be between 1 and 24 hours';
    }
    if (!formData.quality || formData.quality < 1 || formData.quality > 5) {
      newErrors.quality = 'Please select a sleep quality';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    setFormData({ durationMinutes: 420, quality: 3, notes: '' });
    setErrors({});
  };

  const hours = Math.floor(formData.durationMinutes / 60);
  const minutes = formData.durationMinutes % 60;

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Log Sleep">
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Duration Presets */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Quick Select Duration
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {durationPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, durationMinutes: preset.hours * 60 })}
                  className={`btn ${formData.durationMinutes === preset.hours * 60 ? 'btn-primary' : 'btn-secondary'} w-full`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Duration */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Custom Duration *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => {
                    const newHours = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, durationMinutes: newHours * 60 + minutes });
                  }}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => {
                    const newMinutes = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, durationMinutes: hours * 60 + newMinutes });
                  }}
                  className="input w-full"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {hours}h {minutes}m ({formData.durationMinutes} minutes)
            </p>
            {errors.durationMinutes && (
              <p className="text-error text-sm mt-1">{errors.durationMinutes}</p>
            )}
          </div>

          {/* Sleep Quality */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Sleep Quality *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {qualityLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, quality: level.value })}
                  className={`btn ${formData.quality === level.value ? level.color : 'btn-secondary'} w-full text-left justify-start`}
                >
                  <span className="font-medium">{level.label}</span>
                </button>
              ))}
            </div>
            {errors.quality && (
              <p className="text-error text-sm mt-1">{errors.quality}</p>
            )}
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
              placeholder="How did you sleep? Any observations..."
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
              Log Sleep
            </button>
          </div>
        </form>
      </div>
    </Sheet>
  );
};

