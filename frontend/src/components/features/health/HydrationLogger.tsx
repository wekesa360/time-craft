import React, { useState } from 'react';
import type { HydrationData } from '../../../types';
import { 
  Droplets, 
  Coffee, 
  Thermometer,
  Save,
  X,
  Plus,
  Minus
} from 'lucide-react';

interface HydrationLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HydrationData) => void;
}

const drinkTypes = [
  { 
    value: 'water', 
    label: 'Water', 
    icon: '💧', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    defaultAmount: 250 
  },
  { 
    value: 'coffee', 
    label: 'Coffee', 
    icon: '☕', 
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    defaultAmount: 200 
  },
  { 
    value: 'tea', 
    label: 'Tea', 
    icon: '🍵', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    defaultAmount: 200 
  },
  { 
    value: 'juice', 
    label: 'Juice', 
    icon: '🧃', 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    defaultAmount: 200 
  },
  { 
    value: 'sports_drink', 
    label: 'Sports Drink', 
    icon: '🥤', 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    defaultAmount: 350 
  },
  { 
    value: 'other', 
    label: 'Other', 
    icon: '🥛', 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    defaultAmount: 250 
  }
];

const temperatures = [
  { value: 'ice_cold', label: 'Ice Cold', icon: '🧊', description: 'Very cold' },
  { value: 'cold', label: 'Cold', icon: '❄️', description: 'Refreshingly cold' },
  { value: 'room_temp', label: 'Room Temp', icon: '🌡️', description: 'Normal temperature' },
  { value: 'warm', label: 'Warm', icon: '🔥', description: 'Pleasantly warm' },
  { value: 'hot', label: 'Hot', icon: '♨️', description: 'Very hot' }
];

const quickAmounts = [100, 200, 250, 350, 500, 750, 1000];

export const HydrationLogger: React.FC<HydrationLoggerProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<HydrationData>({
    amount: 250,
    drinkType: 'water',
    temperature: 'room_temp'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedDrink = drinkTypes.find(drink => drink.value === formData.drinkType);
  const selectedTemp = temperatures.find(temp => temp.value === formData.temperature);

  const adjustAmount = (change: number) => {
    const newAmount = Math.max(0, formData.amount + change);
    setFormData({ ...formData, amount: newAmount });
  };

  const setQuickAmount = (amount: number) => {
    setFormData({ ...formData, amount });
  };

  const selectDrinkType = (drinkType: string) => {
    const drink = drinkTypes.find(d => d.value === drinkType);
    setFormData({ 
      ...formData, 
      drinkType: drinkType as any,
      amount: drink?.defaultAmount || 250
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.amount > 5000) {
      newErrors.amount = 'Amount seems too large (max 5000ml)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSave(formData);
    
    // Reset form but keep drink type
    setFormData({
      amount: selectedDrink?.defaultAmount || 250,
      drinkType: formData.drinkType,
      temperature: 'room_temp'
    });
    setErrors({});
  };

  const formatAmount = (ml: number) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${ml}ml`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background card max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Droplets className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-foreground">Log Hydration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Drink Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              What did you drink?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {drinkTypes.map((drink) => (
                <button
                  key={drink.value}
                  type="button"
                  onClick={() => selectDrinkType(drink.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.drinkType === drink.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-border hover:border-blue-300 hover:bg-background-secondary'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{drink.icon}</span>
                    <span className="text-sm font-medium text-foreground">{drink.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              How much? ({formatAmount(formData.amount)})
            </label>
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setQuickAmount(amount)}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    formData.amount === amount
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300'
                      : 'border-border hover:bg-background-secondary'
                  }`}
                >
                  {formatAmount(amount)}
                </button>
              ))}
            </div>

            {/* Amount Adjuster */}
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={() => adjustAmount(-50)}
                className="btn-outline p-2"
                disabled={formData.amount <= 50}
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    amount: Number(e.target.value) || 0 
                  })}
                  className={`input w-24 text-center ${errors.amount ? 'border-red-500' : ''}`}
                />
                <span className="text-sm text-foreground-secondary">ml</span>
              </div>
              
              <button
                type="button"
                onClick={() => adjustAmount(50)}
                className="btn-outline p-2"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {errors.amount && (
              <p className="text-red-500 text-sm mt-2 text-center">{errors.amount}</p>
            )}
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              <Thermometer className="w-4 h-4 inline mr-1" />
              Temperature
            </label>
            <div className="grid grid-cols-3 gap-2">
              {temperatures.map((temp) => (
                <button
                  key={temp.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, temperature: temp.value as any })}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.temperature === temp.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-border hover:border-blue-300 hover:bg-background-secondary'
                  }`}
                >
                  <div className="text-lg mb-1">{temp.icon}</div>
                  <div className="text-xs font-medium text-foreground">{temp.label}</div>
                </button>
              ))}
            </div>
            {selectedTemp && (
              <p className="text-xs text-foreground-secondary mt-2 text-center">
                {selectedTemp.description}
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="bg-background-secondary rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{selectedDrink?.icon}</span>
                <div>
                  <p className="font-medium text-foreground">
                    {formatAmount(formData.amount)} of {selectedDrink?.label}
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    {selectedTemp?.label} temperature
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">
                  +{formatAmount(formData.amount)}
                </p>
                <p className="text-xs text-foreground-secondary">hydration</p>
              </div>
            </div>
          </div>

          {/* Hydration Tips */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Hydration Tips</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Aim for 8-10 glasses (2-2.5L) of water daily</li>
              <li>• Drink more during exercise or hot weather</li>
              <li>• Start your day with a glass of water</li>
              <li>• Keep a water bottle nearby as a reminder</li>
            </ul>
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
              Log Hydration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};