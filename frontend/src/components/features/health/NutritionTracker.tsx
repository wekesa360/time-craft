import React, { useState } from 'react';
import type { NutritionData } from '../../../types';
import { 
  Utensils, 
  Plus, 
  Minus, 
  Save,
  X,
  Search
} from 'lucide-react';

interface NutritionTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NutritionData) => void;
}

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', icon: '🌅', time: '7:00 AM' },
  { value: 'lunch', label: 'Lunch', icon: '☀️', time: '12:00 PM' },
  { value: 'dinner', label: 'Dinner', icon: '🌙', time: '7:00 PM' },
  { value: 'snack', label: 'Snack', icon: '🍎', time: 'Anytime' }
];

const commonFoods = [
  { name: 'Apple', calories: 95, serving: '1 medium' },
  { name: 'Banana', calories: 105, serving: '1 medium' },
  { name: 'Chicken Breast', calories: 165, serving: '100g' },
  { name: 'Brown Rice', calories: 216, serving: '1 cup cooked' },
  { name: 'Broccoli', calories: 55, serving: '1 cup' },
  { name: 'Salmon', calories: 206, serving: '100g' },
  { name: 'Greek Yogurt', calories: 100, serving: '170g' },
  { name: 'Oatmeal', calories: 150, serving: '1 cup cooked' },
  { name: 'Avocado', calories: 234, serving: '1 medium' },
  { name: 'Eggs', calories: 70, serving: '1 large' },
  { name: 'Sweet Potato', calories: 112, serving: '1 medium' },
  { name: 'Almonds', calories: 164, serving: '28g (23 nuts)' }
];

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
}

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<NutritionData>({
    mealType: 'breakfast',
    description: '',
    calories: undefined,
    protein: undefined,
    carbs: undefined,
    fat: undefined,
    fiber: undefined,
    sugar: undefined
  });

  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customFood, setCustomFood] = useState({ name: '', calories: 0, quantity: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredFoods = commonFoods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);

  const addFood = (food: { name: string; calories: number; serving: string }) => {
    const newFood: FoodItem = {
      name: food.name,
      quantity: food.serving,
      calories: food.calories
    };
    setFoods([...foods, newFood]);
    setSearchTerm('');
  };

  const addCustomFood = () => {
    if (customFood.name && customFood.calories > 0 && customFood.quantity) {
      const newFood: FoodItem = {
        name: customFood.name,
        quantity: customFood.quantity,
        calories: customFood.calories
      };
      setFoods([...foods, newFood]);
      setCustomFood({ name: '', calories: 0, quantity: '' });
    }
  };

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const updateFoodCalories = (index: number, calories: number) => {
    const updatedFoods = [...foods];
    updatedFoods[index].calories = calories;
    setFoods(updatedFoods);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (foods.length === 0 && !formData.description) {
      newErrors.foods = 'Please add at least one food item or description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const description = foods.length > 0 
      ? foods.map(food => `${food.name} (${food.quantity})`).join(', ')
      : formData.description;

    const nutritionData: NutritionData = {
      ...formData,
      description: description || '',
      calories: totalCalories > 0 ? totalCalories : formData.calories
    };

    onSave(nutritionData);
    
    // Reset form
    setFormData({
      mealType: 'breakfast',
      description: '',
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      fiber: undefined,
      sugar: undefined
    });
    setFoods([]);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Utensils className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-foreground">Track Nutrition</h2>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Meal Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Meal Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {mealTypes.map((meal) => (
                <button
                  key={meal.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, mealType: meal.value as any })}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.mealType === meal.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-border hover:border-green-300 hover:bg-background-secondary'
                  }`}
                >
                  <div className="text-2xl mb-1">{meal.icon}</div>
                  <div className="text-sm font-medium text-foreground">{meal.label}</div>
                  <div className="text-xs text-foreground-secondary">{meal.time}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Food Search and Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Food Search */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Search Foods
              </label>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                  placeholder="Search for foods..."
                />
              </div>

              {/* Common Foods */}
              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredFoods.map((food, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addFood(food)}
                    className="w-full p-3 text-left border border-border rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{food.name}</p>
                        <p className="text-sm text-foreground-secondary">{food.serving}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{food.calories} cal</p>
                        <Plus className="w-4 h-4 text-green-600 ml-auto" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Food Entry */}
              <div className="mt-4 p-4 border border-border rounded-lg">
                <h4 className="font-medium text-foreground mb-3">Add Custom Food</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customFood.name}
                    onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                    className="input w-full"
                    placeholder="Food name"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={customFood.quantity}
                      onChange={(e) => setCustomFood({ ...customFood, quantity: e.target.value })}
                      className="input w-full"
                      placeholder="Quantity (e.g., 1 cup)"
                    />
                    <input
                      type="number"
                      value={customFood.calories || ''}
                      onChange={(e) => setCustomFood({ ...customFood, calories: Number(e.target.value) || 0 })}
                      className="input w-full"
                      placeholder="Calories"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addCustomFood}
                    className="btn-outline w-full"
                    disabled={!customFood.name || !customFood.calories || !customFood.quantity}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Food
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Foods */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Selected Foods
              </label>
              <div className="border border-border rounded-lg p-4 min-h-[300px]">
                {foods.length === 0 ? (
                  <div className="text-center text-foreground-secondary py-8">
                    <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No foods added yet</p>
                    <p className="text-sm">Search and add foods from the left</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {foods.map((food, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{food.name}</p>
                          <p className="text-sm text-foreground-secondary">{food.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={food.calories}
                            onChange={(e) => updateFoodCalories(index, Number(e.target.value) || 0)}
                            className="input w-20 text-center"
                          />
                          <span className="text-sm text-foreground-secondary">cal</span>
                          <button
                            type="button"
                            onClick={() => removeFood(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total Calories */}
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span>Total Calories:</span>
                        <span>{totalCalories} cal</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manual Description (Alternative) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Or describe your meal manually
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full h-20 resize-none"
              placeholder="Describe what you ate..."
            />
          </div>

          {/* Macronutrients (Optional) */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Macronutrients (Optional)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-foreground-secondary mb-1">Protein (g)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.protein || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    protein: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="input w-full"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-secondary mb-1">Carbs (g)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.carbs || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    carbs: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="input w-full"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-secondary mb-1">Fat (g)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.fat || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    fat: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="input w-full"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-secondary mb-1">Fiber (g)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.fiber || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    fiber: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="input w-full"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-secondary mb-1">Sugar (g)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.sugar || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    sugar: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="input w-full"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-secondary mb-1">Total Calories</label>
                <input
                  type="number"
                  min="0"
                  value={totalCalories > 0 ? totalCalories : (formData.calories || '')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    calories: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="input w-full"
                  placeholder="0"
                  disabled={totalCalories > 0}
                />
              </div>
            </div>
          </div>

          {errors.foods && (
            <p className="text-red-500 text-sm">{errors.foods}</p>
          )}

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
              Log Nutrition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};