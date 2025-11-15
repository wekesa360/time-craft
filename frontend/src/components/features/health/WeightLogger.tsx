import React, { useState } from 'react';
import type { WeightData } from '../../../types';
import { Sheet } from '../../ui/Sheet';

interface WeightLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WeightData) => void;
}

export const WeightLogger: React.FC<WeightLoggerProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<WeightData>({
    weight: 70,
    unit: 'kg',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.weight || formData.weight <= 0) {
      newErrors.weight = 'Weight must be greater than 0';
    }
    if (formData.unit === 'kg' && (formData.weight < 10 || formData.weight > 500)) {
      newErrors.weight = 'Weight must be between 10 and 500 kg';
    }
    if (formData.unit === 'lb' && (formData.weight < 22 || formData.weight > 1100)) {
      newErrors.weight = 'Weight must be between 22 and 1100 lbs';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    setFormData({ weight: 70, unit: 'kg', notes: '' });
    setErrors({});
  };

  const convertedWeight = formData.unit === 'kg' 
    ? (formData.weight * 2.20462).toFixed(1) 
    : (formData.weight * 0.453592).toFixed(1);

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Log Weight">
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Unit *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  // Convert weight when switching units
                  const newWeight = formData.unit === 'kg' 
                    ? formData.weight 
                    : parseFloat(convertedWeight);
                  setFormData({ ...formData, unit: 'kg', weight: newWeight });
                }}
                className={`btn ${formData.unit === 'kg' ? 'btn-primary' : 'btn-secondary'} w-full`}
              >
                Kilograms (kg)
              </button>
              <button
                type="button"
                onClick={() => {
                  // Convert weight when switching units
                  const newWeight = formData.unit === 'lb' 
                    ? formData.weight 
                    : parseFloat(convertedWeight);
                  setFormData({ ...formData, unit: 'lb', weight: newWeight });
                }}
                className={`btn ${formData.unit === 'lb' ? 'btn-primary' : 'btn-secondary'} w-full`}
              >
                Pounds (lb)
              </button>
            </div>
          </div>

          {/* Weight Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Weight *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min={formData.unit === 'kg' ? 10 : 22}
                max={formData.unit === 'kg' ? 500 : 1100}
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                className="input w-full pr-16"
                placeholder={formData.unit === 'kg' ? '70.0' : '154.0'}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {formData.unit}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {formData.unit === 'kg' ? `${convertedWeight} lbs` : `${convertedWeight} kg`}
            </p>
            {errors.weight && (
              <p className="text-error text-sm mt-1">{errors.weight}</p>
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
              placeholder="Any observations about your weight..."
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
              Log Weight
            </button>
          </div>
        </form>
      </div>
    </Sheet>
  );
};

