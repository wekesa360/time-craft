import React, { useState } from 'react';
import type { HydrationData } from '../../../types';
import { Sheet } from '../../ui/Sheet';

interface HydrationLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HydrationData) => void;
}

const drinkTypes = [
  { value: 'water', label: 'Water', defaultAmount: 250 },
  { value: 'coffee', label: 'Coffee', defaultAmount: 200 },
  { value: 'tea', label: 'Tea', defaultAmount: 200 },
  { value: 'juice', label: 'Juice', defaultAmount: 200 },
  { value: 'sports_drink', label: 'Sports Drink', defaultAmount: 350 },
  { value: 'other', label: 'Other', defaultAmount: 250 }
];

const temperatures = [
  { value: 'ice_cold', label: 'Ice Cold', description: 'Very cold' },
  { value: 'cold', label: 'Cold', description: 'Refreshingly cold' },
  { value: 'room_temp', label: 'Room Temp', description: 'Normal temperature' },
  { value: 'warm', label: 'Warm', description: 'Pleasantly warm' },
  { value: 'hot', label: 'Hot', description: 'Very hot' }
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

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Log Hydration">
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
        {/* Drink Type */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">
            What did you drink?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {drinkTypes.map((drink) => (
              <button
                key={drink.value}
                type="button"
                onClick={() => selectDrinkType(drink.value)}
                className={`btn ${formData.drinkType === drink.value ? 'btn-primary' : 'btn-secondary'} w-full py-3`}
              >
                {drink.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-6">
          <label className="block text-sm font-medium text-foreground">
            How much? ({formatAmount(formData.amount)})
          </label>
          
          {/* Quick Amount Buttons */}
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setQuickAmount(amount)}
                  className={`btn ${formData.amount === amount ? 'btn-primary' : 'btn-secondary'} w-full py-2 text-sm`}
                >
                  {formatAmount(amount)}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Adjuster */}
          <div className="flex items-center justify-center space-x-6 py-4">
            <button
              type="button"
              onClick={() => adjustAmount(-50)}
              className="btn btn-secondary px-4 py-2"
              disabled={formData.amount <= 50}
            >
              -
            </button>
            
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                max="5000"
                value={formData.amount}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  amount: Number(e.target.value) || 0 
                })}
                className={`input w-24 text-center py-2 ${errors.amount ? 'border-red-500' : ''}`}
              />
              <span className="text-sm text-foreground-secondary font-medium">ml</span>
            </div>
            
            <button
              type="button"
              onClick={() => adjustAmount(50)}
              className="btn btn-secondary px-4 py-2"
            >
              +
            </button>
          </div>

          {errors.amount && (
            <p className="text-error-light0 text-sm text-center">{errors.amount}</p>
          )}
        </div>

        {/* Temperature */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">
            Temperature
          </label>
          <div className="grid grid-cols-3 gap-2">
            {temperatures.map((temp) => (
              <button
                key={temp.value}
                type="button"
                onClick={() => setFormData({ ...formData, temperature: temp.value as any })}
                className={`btn ${formData.temperature === temp.value ? 'btn-primary' : 'btn-secondary'} w-full py-3`}
              >
                <div className="text-sm font-medium">{temp.label}</div>
              </button>
            ))}
          </div>
          {selectedTemp && (
            <p className="text-sm text-foreground-secondary text-center py-2">
              {selectedTemp.description}
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="bg-background-secondary rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground text-lg">
                {formatAmount(formData.amount)} of {selectedDrink?.label}
              </p>
              <p className="text-sm text-foreground-secondary mt-1">
                {selectedTemp?.label} temperature
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-info">
                +{formatAmount(formData.amount)}
              </p>
              <p className="text-sm text-foreground-secondary">hydration</p>
            </div>
          </div>
        </div>

        {/* Hydration Tips */}
        <div className="bg-info-light dark:bg-info/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-info dark:text-info-light mb-4">Hydration Tips</h4>
          <ul className="text-sm text-info dark:text-info-light space-y-2">
            <li>• Aim for 8-10 glasses (2-2.5L) of water daily</li>
            <li>• Drink more during exercise or hot weather</li>
            <li>• Start your day with a glass of water</li>
            <li>• Keep a water bottle nearby as a reminder</li>
          </ul>
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
            Log Hydration
          </button>
        </div>
        </form>
      </div>
    </Sheet>
  );
};