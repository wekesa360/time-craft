import React, { useState } from 'react';
import type { NutritionData } from '../../../types';
import { Sheet } from '../../ui/Sheet';

interface NutritionTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NutritionData) => void;
}

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', time: '7:00 AM' },
  { value: 'lunch', label: 'Lunch', time: '12:00 PM' },
  { value: 'dinner', label: 'Dinner', time: '7:00 PM' },
  { value: 'snack', label: 'Snack', time: 'Anytime' }
];

const exampleFoods = [
  { name: 'Grilled chicken breast with rice and vegetables', serving: '1 plate' },
  { name: 'Greek yogurt with berries and honey', serving: '1 bowl' },
  { name: 'Salmon fillet with quinoa and asparagus', serving: '1 portion' },
  { name: 'Avocado toast with eggs', serving: '2 slices' },
  { name: 'Mixed green salad with olive oil dressing', serving: '1 large bowl' }
];

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
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
  const [newFood, setNewFood] = useState({ name: '', quantity: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);
  const totalProtein = foods.reduce((sum, food) => sum + (food.protein || 0), 0);
  const totalCarbs = foods.reduce((sum, food) => sum + (food.carbs || 0), 0);
  const totalFat = foods.reduce((sum, food) => sum + (food.fat || 0), 0);

  // Simulate AI analysis of food
  const analyzeFoodWithAI = async (foodName: string, quantity: string): Promise<FoodItem> => {
    setIsAnalyzing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock AI analysis - in real implementation, this would call an AI service
    const mockAnalysis = {
      'grilled chicken breast with rice and vegetables': { calories: 450, protein: 35, carbs: 45, fat: 12, fiber: 4, sugar: 3 },
      'greek yogurt with berries and honey': { calories: 180, protein: 15, carbs: 25, fat: 4, fiber: 3, sugar: 20 },
      'salmon fillet with quinoa and asparagus': { calories: 380, protein: 28, carbs: 35, fat: 16, fiber: 5, sugar: 2 },
      'avocado toast with eggs': { calories: 320, protein: 18, carbs: 25, fat: 20, fiber: 8, sugar: 3 },
      'mixed green salad with olive oil dressing': { calories: 150, protein: 6, carbs: 12, fat: 10, fiber: 4, sugar: 8 }
    };
    
    const key = foodName.toLowerCase();
    const analysis = mockAnalysis[key] || {
      calories: Math.floor(Math.random() * 200) + 100,
      protein: Math.floor(Math.random() * 20) + 5,
      carbs: Math.floor(Math.random() * 30) + 10,
      fat: Math.floor(Math.random() * 15) + 5,
      fiber: Math.floor(Math.random() * 8) + 2,
      sugar: Math.floor(Math.random() * 15) + 3
    };
    
    setIsAnalyzing(false);
    
    return {
      name: foodName,
      quantity: quantity,
      ...analysis
    };
  };

  const addFood = async () => {
    if (!newFood.name.trim() || !newFood.quantity.trim()) return;
    
    try {
      const analyzedFood = await analyzeFoodWithAI(newFood.name, newFood.quantity);
      setFoods([...foods, analyzedFood]);
      setNewFood({ name: '', quantity: '' });
    } catch (error) {
      console.error('Error analyzing food:', error);
    }
  };

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const updateFoodNutrition = (index: number, field: keyof Omit<FoodItem, 'name' | 'quantity'>, value: number) => {
    const updatedFoods = [...foods];
    (updatedFoods[index] as any)[field] = value;
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
      calories: totalCalories > 0 ? totalCalories : formData.calories,
      protein: totalProtein > 0 ? totalProtein : formData.protein,
      carbs: totalCarbs > 0 ? totalCarbs : formData.carbs,
      fat: totalFat > 0 ? totalFat : formData.fat
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

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Track Nutrition"
      className="p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
                  className={`btn ${formData.mealType === meal.value ? 'btn-primary' : 'btn-secondary'} w-full`}
                >
                  <div className="text-sm font-medium">{meal.label}</div>
                  <div className="text-xs opacity-75">{meal.time}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Add Food Section */}
          <div className="w-full">
            <label className="block text-sm font-medium text-foreground mb-3">
              Add Food
            </label>
            
            {/* Food Input */}
            <div className="bg-background-secondary rounded-lg p-4 border border-border mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  className="input w-full"
                  placeholder="Describe your food (e.g., grilled chicken with rice)"
                />
                <input
                  type="text"
                  value={newFood.quantity}
                  onChange={(e) => setNewFood({ ...newFood, quantity: e.target.value })}
                  className="input w-full"
                  placeholder="Quantity (e.g., 1 plate, 2 cups)"
                />
                <button
                  type="button"
                  onClick={addFood}
                  disabled={!newFood.name.trim() || !newFood.quantity.trim() || isAnalyzing}
                  className="btn btn-primary"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    'Add Food'
                  )}
                </button>
              </div>
              
              {/* AI Analysis Info */}
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 text-blue-600 mt-0.5">🤖</div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">AI-Powered Analysis</p>
                    <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                      Our AI will automatically calculate calories, protein, carbs, fat, fiber, and sugar content for your food.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Foods */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-foreground mb-3">Example descriptions:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {exampleFoods.map((food, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setNewFood({ name: food.name, quantity: food.serving })}
                    className="p-3 text-left border border-border rounded-lg hover:bg-background-secondary transition-colors hover:border-primary-300"
                  >
                    <p className="text-sm font-medium text-foreground">{food.name}</p>
                    <p className="text-xs text-foreground-secondary">{food.serving}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Foods Section */}
          <div className="w-full">
            <label className="block text-sm font-medium text-foreground mb-3">
              Selected Foods
            </label>
            <div className="border border-border rounded-lg p-4 min-h-[200px] bg-background-secondary">
              {foods.length === 0 ? (
                <div className="text-center text-foreground-secondary py-12">
                  <p className="text-lg font-medium mb-2">No foods added yet</p>
                  <p className="text-sm">Search and add foods from above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {foods.map((food, index) => (
                    <div key={index} className="p-4 bg-background rounded-lg border border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-foreground mb-1">{food.name}</p>
                          <p className="text-sm text-foreground-secondary">{food.quantity}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFood(index)}
                          className="btn btn-secondary p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          -
                        </button>
                      </div>
                      
                      {/* Nutritional Information */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Calories:</span>
                          <input
                            type="number"
                            value={food.calories}
                            onChange={(e) => updateFoodNutrition(index, 'calories', Number(e.target.value) || 0)}
                            className="input w-16 text-center text-xs"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Protein:</span>
                          <input
                            type="number"
                            value={food.protein || 0}
                            onChange={(e) => updateFoodNutrition(index, 'protein', Number(e.target.value) || 0)}
                            className="input w-16 text-center text-xs"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Carbs:</span>
                          <input
                            type="number"
                            value={food.carbs || 0}
                            onChange={(e) => updateFoodNutrition(index, 'carbs', Number(e.target.value) || 0)}
                            className="input w-16 text-center text-xs"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Fat:</span>
                          <input
                            type="number"
                            value={food.fat || 0}
                            onChange={(e) => updateFoodNutrition(index, 'fat', Number(e.target.value) || 0)}
                            className="input w-16 text-center text-xs"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Fiber:</span>
                          <input
                            type="number"
                            value={food.fiber || 0}
                            onChange={(e) => updateFoodNutrition(index, 'fiber', Number(e.target.value) || 0)}
                            className="input w-16 text-center text-xs"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-secondary">Sugar:</span>
                          <input
                            type="number"
                            value={food.sugar || 0}
                            onChange={(e) => updateFoodNutrition(index, 'sugar', Number(e.target.value) || 0)}
                            className="input w-16 text-center text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Total Nutrition */}
                  <div className="border-t border-border pt-4 mt-4">
                    <h4 className="font-semibold text-foreground mb-3">Total Nutrition:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-primary-50 dark:bg-primary-950/20 rounded-lg">
                        <p className="text-2xl font-bold text-primary-600">{totalCalories}</p>
                        <p className="text-xs text-foreground-secondary">Calories</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{totalProtein}g</p>
                        <p className="text-xs text-foreground-secondary">Protein</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{totalCarbs}g</p>
                        <p className="text-xs text-foreground-secondary">Carbs</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{totalFat}g</p>
                        <p className="text-xs text-foreground-secondary">Fat</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Log Nutrition
            </button>
          </div>
      </form>
    </Sheet>
  );
};