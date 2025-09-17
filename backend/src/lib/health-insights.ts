// Advanced Health Insights Service
// AI-powered nutrition analysis, health insights dashboard, and goal tracking

import { generateId } from "../utils/id";
import type { Env } from "./env";

export interface NutritionAnalysis {
  id: string;
  user_id: string;
  analysis_date: number;
  total_calories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    sodium_mg: number;
  };
  micronutrients: {
    vitamin_c_mg?: number;
    vitamin_d_iu?: number;
    calcium_mg?: number;
    iron_mg?: number;
    potassium_mg?: number;
  };
  meal_distribution: {
    breakfast_calories: number;
    lunch_calories: number;
    dinner_calories: number;
    snack_calories: number;
  };
  nutritional_score: number; // 0-10
  recommendations: string[];
  deficiencies: string[];
  created_at: number;
}

export interface HealthGoal {
  id: string;
  user_id: string;
  goal_type:
    | "weight_loss"
    | "weight_gain"
    | "muscle_gain"
    | "endurance"
    | "strength"
    | "nutrition"
    | "sleep"
    | "hydration"
    | "custom";
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  target_unit: string;
  start_date: number;
  target_date: number;
  status: "active" | "completed" | "paused" | "cancelled";
  priority: number;
  milestones: Array<{
    id: string;
    title: string;
    target_value: number;
    completed: boolean;
    completed_at?: number;
  }>;
  progress_notes: Array<{
    id: string;
    note: string;
    value: number;
    recorded_at: number;
  }>;
  created_at: number;
  updated_at: number;
}

export interface HealthInsight {
  id: string;
  user_id: string;
  insight_type:
    | "trend"
    | "correlation"
    | "recommendation"
    | "achievement"
    | "warning";
  category:
    | "exercise"
    | "nutrition"
    | "mood"
    | "sleep"
    | "hydration"
    | "overall";
  title: string;
  description: string;
  confidence_score: number; // 0-1
  data_points: any[];
  action_items: string[];
  is_read: boolean;
  priority: number;
  created_at: number;
}

export interface DashboardWidget {
  id: string;
  type: "chart" | "metric" | "goal_progress" | "insights" | "streak";
  title: string;
  data: any;
  position: { x: number; y: number; width: number; height: number };
  config: any;
}

export class HealthInsightsService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  // ========== NUTRITION ANALYSIS ==========

  async analyzeNutrition(
    userId: string,
    date?: number
  ): Promise<NutritionAnalysis> {
    const analysisDate = date || Date.now();
    const dayStart = new Date(analysisDate).setHours(0, 0, 0, 0);
    const dayEnd = new Date(analysisDate).setHours(23, 59, 59, 999);

    try {
      // Get nutrition entries for the day
      const nutritionEntries = await this.env.DB.prepare(
        `
        SELECT * FROM nutrition_entries 
        WHERE user_id = ? AND recorded_at >= ? AND recorded_at <= ?
        ORDER BY recorded_at ASC
      `
      )
        .bind(userId, dayStart, dayEnd)
        .all();

      // Get health_logs nutrition data as fallback
      const healthNutritionLogs = await this.env.DB.prepare(
        `
        SELECT * FROM health_logs 
        WHERE user_id = ? AND type = 'nutrition' 
        AND recorded_at >= ? AND recorded_at <= ?
        ORDER BY recorded_at ASC
      `
      )
        .bind(userId, dayStart, dayEnd)
        .all();

      const analysis = await this.calculateNutritionAnalysis(
        nutritionEntries.results || [],
        healthNutritionLogs.results || []
      );

      // Cache the analysis
      const analysisId = generateId('nutrition_analysis');
      await this.env.DB.prepare(
        `
        INSERT OR REPLACE INTO nutrition_analysis 
        (id, user_id, analysis_date, total_calories, macros, micronutrients, 
         meal_distribution, nutritional_score, recommendations, deficiencies, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          analysisId,
          userId,
          dayStart,
          analysis.total_calories,
          JSON.stringify(analysis.macros),
          JSON.stringify(analysis.micronutrients),
          JSON.stringify(analysis.meal_distribution),
          analysis.nutritional_score,
          JSON.stringify(analysis.recommendations),
          JSON.stringify(analysis.deficiencies),
          Date.now()
        )
        .run();

      return {
        id: analysisId,
        user_id: userId,
        analysis_date: dayStart,
        ...analysis,
        created_at: Date.now(),
      };
    } catch (error) {
      console.error("Nutrition analysis failed:", { userId, error });
      throw error;
    }
  }

  private async calculateNutritionAnalysis(
    nutritionEntries: any[],
    healthLogs: any[]
  ) {
    let totalCalories = 0;
    const macros = {
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
    };
    const micronutrients = {};
    const mealDistribution = {
      breakfast_calories: 0,
      lunch_calories: 0,
      dinner_calories: 0,
      snack_calories: 0,
    };

    // Process nutrition entries
    for (const entry of nutritionEntries) {
      totalCalories += entry.calories || 0;
      const mealKey = `${entry.meal_type}_calories` as keyof typeof mealDistribution;
      if (mealKey in mealDistribution) {
        mealDistribution[mealKey] += entry.calories || 0;
      }

      if (entry.macros) {
        const entryMacros =
          typeof entry.macros === "string"
            ? JSON.parse(entry.macros)
            : entry.macros;
        Object.keys(macros).forEach((key) => {
          const macroKey = key as keyof typeof macros;
          macros[macroKey] += entryMacros[key] || 0;
        });
      }
    }

    // Process health logs as fallback
    for (const log of healthLogs) {
      const payload =
        typeof log.payload === "string" ? JSON.parse(log.payload) : log.payload;
      
      if (payload && payload.total_calories) {
        totalCalories += payload.total_calories || 0;

        if (payload.meal_type && payload.total_calories) {
          const mealKey = `${payload.meal_type}_calories` as keyof typeof mealDistribution;
          if (mealKey in mealDistribution) {
            mealDistribution[mealKey] += payload.total_calories;
          }
        }
      }
    }

    // Calculate nutrition score (simplified algorithm)
    let nutritionScore = 5; // Base score

    // Adjust based on calorie intake (assuming 2000 cal target)
    const calorieRatio = totalCalories / 2000;
    if (calorieRatio >= 0.8 && calorieRatio <= 1.2) nutritionScore += 1;

    // Adjust based on macro balance
    const proteinRatio = (macros.protein_g * 4) / totalCalories;
    const carbRatio = (macros.carbs_g * 4) / totalCalories;
    const fatRatio = (macros.fat_g * 9) / totalCalories;

    if (proteinRatio >= 0.15 && proteinRatio <= 0.35) nutritionScore += 1;
    if (carbRatio >= 0.45 && carbRatio <= 0.65) nutritionScore += 1;
    if (fatRatio >= 0.2 && fatRatio <= 0.35) nutritionScore += 1;
    if (macros.fiber_g >= 25) nutritionScore += 1;

    // Generate recommendations
    const recommendations = [];
    const deficiencies = [];

    if (totalCalories < 1200) {
      recommendations.push(
        "Consider increasing your calorie intake for better energy levels"
      );
      deficiencies.push("calories");
    }
    if (macros.protein_g < 50) {
      recommendations.push(
        "Add more protein-rich foods to support muscle health"
      );
      deficiencies.push("protein");
    }
    if (macros.fiber_g < 25) {
      recommendations.push(
        "Include more fruits, vegetables, and whole grains for fiber"
      );
      deficiencies.push("fiber");
    }

    return {
      total_calories: totalCalories,
      macros,
      micronutrients,
      meal_distribution: mealDistribution,
      nutritional_score: Math.min(10, nutritionScore),
      recommendations,
      deficiencies,
    };
  }

  // ========== HEALTH GOAL TRACKING ==========

  async createHealthGoal(
    userId: string,
    goalData: Partial<HealthGoal>
  ): Promise<HealthGoal> {
    const goalId = generateId('health_goal');
    const now = Date.now();

    const goal: HealthGoal = {
      id: goalId,
      user_id: userId,
      goal_type: goalData.goal_type || "custom",
      title: goalData.title || "",
      description: goalData.description || "",
      target_value: goalData.target_value || 0,
      current_value: goalData.current_value || 0,
      target_unit: goalData.target_unit || "",
      start_date: goalData.start_date || now,
      target_date: goalData.target_date || now + 30 * 24 * 60 * 60 * 1000, // 30 days default
      status: "active",
      priority: goalData.priority || 3,
      milestones: goalData.milestones || [],
      progress_notes: goalData.progress_notes || [],
      created_at: now,
      updated_at: now,
    };

    await this.env.DB.prepare(
      `
      INSERT INTO health_goals 
      (id, user_id, goal_type, title, description, target_value, current_value, 
       target_unit, start_date, target_date, status, priority, tracking_method,
       milestones, progress_notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        goal.id,
        goal.user_id,
        goal.goal_type,
        goal.title,
        goal.description,
        goal.target_value,
        goal.current_value,
        goal.target_unit,
        goal.start_date,
        goal.target_date,
        goal.status,
        goal.priority,
        "manual",
        JSON.stringify(goal.milestones),
        JSON.stringify(goal.progress_notes),
        goal.created_at,
        goal.updated_at
      )
      .run();

    return (goal.results || []);
  }

  async updateGoalProgress(
    goalId: string,
    userId: string,
    newValue: number,
    notes?: string
  ): Promise<void> {
    const goal = await this.getHealthGoal(goalId, userId);
    if (!goal) throw new Error("Goal not found");

    const progressPercentage = Math.min(
      100,
      (newValue / goal.target_value) * 100
    );

    // Update goal current value
    await this.env.DB.prepare(
      `
      UPDATE health_goals 
      SET current_value = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `
    )
      .bind(newValue, Date.now(), goalId, userId)
      .run();

    // Record progress entry
    await this.env.DB.prepare(
      `
      INSERT INTO health_goal_progress 
      (id, goal_id, user_id, progress_value, progress_percentage, notes, recorded_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        generateId('goal_progress'),
        goalId,
        userId,
        newValue,
        progressPercentage,
        notes || null,
        Date.now(),
        Date.now()
      )
      .run();

    // Check if goal is completed
    if (progressPercentage >= 100) {
      await this.env.DB.prepare(
        `
        UPDATE health_goals 
        SET status = 'completed', updated_at = ?
        WHERE id = ? AND user_id = ?
      `
      )
        .bind(Date.now(), goalId, userId)
        .run();

      // Generate achievement insight
      await this.createInsight(userId, {
        insight_type: "achievement",
        category:
          goal.goal_type === "custom" ? "overall" : (goal.goal_type as any),
        title: `Goal Achieved: ${goal.title}`,
        description: `Congratulations! You've successfully completed your ${goal.goal_type} goal.`,
        confidence_score: 1.0,
        data_points: [{ goal_id: goalId, final_value: newValue }],
        action_items: ["Set a new challenging goal to maintain momentum"],
        priority: 5,
      });
    }
  }

  async getHealthGoals(userId: string, status?: string): Promise<HealthGoal[]> {
    let query = "SELECT * FROM health_goals WHERE user_id = ?";
    const params = [userId];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY priority DESC, created_at DESC";

    const result = await this.env.DB.prepare(query)
      .bind(...params)
      .all();
    const goals = result.results || [];

    return goals.map((goal: any) => ({
      ...goal,
      milestones:
        typeof goal.milestones === "string"
          ? JSON.parse(goal.milestones)
          : goal.milestones || [],
      progress_notes:
        typeof goal.progress_notes === "string"
          ? JSON.parse(goal.progress_notes)
          : goal.progress_notes || [],
    })) as HealthGoal[];
  }

  async getHealthGoal(
    goalId: string,
    userId: string
  ): Promise<HealthGoal | null> {
    const result = await this.env.DB.prepare(
      `
      SELECT * FROM health_goals WHERE id = ? AND user_id = ?
    `
    )
      .bind(goalId, userId)
      .first();

    if (!result) return (null.results || []);

    return {
      ...result,
      milestones:
        typeof result.milestones === "string"
          ? JSON.parse(result.milestones)
          : result.milestones || [],
      progress_notes:
        typeof result.progress_notes === "string"
          ? JSON.parse(result.progress_notes)
          : result.progress_notes || [],
    } as HealthGoal;
  }

  // ========== HEALTH INSIGHTS GENERATION ==========

  async generateHealthInsights(userId: string): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    try {
      // Get recent health data from multiple sources
      const [
        healthLogs,
        nutritionEntries,
        exerciseEntries,
        moodEntries,
        sleepEntries,
      ] = await Promise.all([
        this.env.DB.prepare(
          `SELECT * FROM health_logs WHERE user_id = ? AND recorded_at >= ? ORDER BY recorded_at DESC`
        )
          .bind(userId, thirtyDaysAgo)
          .all(),
        this.env.DB.prepare(
          `SELECT * FROM nutrition_entries WHERE user_id = ? AND recorded_at >= ? ORDER BY recorded_at DESC`
        )
          .bind(userId, thirtyDaysAgo)
          .all(),
        this.env.DB.prepare(
          `SELECT * FROM exercise_entries WHERE user_id = ? AND recorded_at >= ? ORDER BY recorded_at DESC`
        )
          .bind(userId, thirtyDaysAgo)
          .all(),
        this.env.DB.prepare(
          `SELECT * FROM mood_entries WHERE user_id = ? AND recorded_at >= ? ORDER BY recorded_at DESC`
        )
          .bind(userId, thirtyDaysAgo)
          .all(),
        this.env.DB.prepare(
          `SELECT * FROM sleep_entries WHERE user_id = ? AND recorded_at >= ? ORDER BY recorded_at DESC`
        )
          .bind(userId, thirtyDaysAgo)
          .all(),
      ]);

      const healthData = {
        healthLogs: healthLogs.results || [],
        nutritionEntries: nutritionEntries.results || [],
        exerciseEntries: exerciseEntries.results || [],
        moodEntries: moodEntries.results || [],
        sleepEntries: sleepEntries.results || [],
      };

      if (
        healthData.healthLogs.length === 0 &&
        healthData.nutritionEntries.length === 0 &&
        healthData.exerciseEntries.length === 0
      ) {
        return (insights.results || []);
      }

      // Generate different types of insights
      const trendInsights = await this.generateTrendInsights(
        userId,
        healthData
      );
      const correlationInsights = await this.generateCorrelationInsights(
        userId,
        healthData
      );
      const recommendationInsights = await this.generateRecommendationInsights(
        userId,
        healthData
      );

      insights.push(
        ...trendInsights,
        ...correlationInsights,
        ...recommendationInsights
      );

      // Save insights to database
      for (const insight of insights) {
        await this.createInsight(userId, insight);
      }

      return (insights.results || []);
    } catch (error) {
      console.error("Health insights generation failed:", { userId, error });
      return (insights.results || []);
    }
  }

  private async createInsight(
    userId: string,
    insightData: Partial<HealthInsight>
  ): Promise<void> {
    const insightId = generateId('health_insight');

    await this.env.DB.prepare(
      `
      INSERT INTO health_insights 
      (id, user_id, insight_type, category, title, description, confidence_score, 
       data_points, action_items, is_read, priority, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        insightId,
        userId,
        insightData.insight_type || "recommendation",
        insightData.category || "overall",
        insightData.title || "",
        insightData.description || "",
        insightData.confidence_score || 0.5,
        JSON.stringify(insightData.data_points || []),
        JSON.stringify(insightData.action_items || []),
        false,
        insightData.priority || 3,
        Date.now()
      )
      .run();
  }

  private async generateTrendInsights(
    userId: string,
    data: any
  ): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];

    // Exercise trend analysis
    if (data.exerciseEntries.length >= 7) {
      const recentWeek = data.exerciseEntries.slice(0, 7);
      const previousWeek = data.exerciseEntries.slice(7, 14);

      const recentAvgDuration =
        recentWeek.reduce(
          (sum: number, entry: any) => sum + (entry.duration_minutes || 0),
          0
        ) / recentWeek.length;
      const previousAvgDuration =
        previousWeek.length > 0
          ? previousWeek.reduce(
              (sum: number, entry: any) => sum + (entry.duration_minutes || 0),
              0
            ) / previousWeek.length
          : 0;

      if (recentAvgDuration > previousAvgDuration * 1.2) {
        insights.push({
          id: generateId('trend_insight'),
          user_id: userId,
          insight_type: "trend",
          category: "exercise",
          title: "Exercise Duration Increasing",
          description: `Your average exercise duration has increased by ${Math.round(((recentAvgDuration - previousAvgDuration) / previousAvgDuration) * 100)}% this week!`,
          confidence_score: 0.8,
          data_points: [
            {
              recent_avg: recentAvgDuration,
              previous_avg: previousAvgDuration,
            },
          ],
          action_items: [
            "Keep up the great momentum",
            "Consider setting a new fitness goal",
          ],
          is_read: false,
          priority: 4,
          created_at: Date.now(),
        });
      }
    }

    return (insights.results || []);
  }

  private async generateCorrelationInsights(
    userId: string,
    data: any
  ): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];

    // Mood vs Exercise correlation
    if (data.moodEntries.length >= 10 && data.exerciseEntries.length >= 5) {
      // Simple correlation analysis
      const exerciseDays = new Set(
        data.exerciseEntries.map((e: any) => new Date(e.recorded_at).toDateString())
      );
      const moodOnExerciseDays = data.moodEntries.filter((m: any) =>
        exerciseDays.has(new Date(m.recorded_at).toDateString())
      );
      const moodOnNonExerciseDays = data.moodEntries.filter(
        (m: any) => !exerciseDays.has(new Date(m.recorded_at).toDateString())
      );

      if (moodOnExerciseDays.length > 0 && moodOnNonExerciseDays.length > 0) {
        const avgMoodWithExercise =
          moodOnExerciseDays.reduce((sum: number, m: any) => sum + m.mood_score, 0) /
          moodOnExerciseDays.length;
        const avgMoodWithoutExercise =
          moodOnNonExerciseDays.reduce((sum: number, m: any) => sum + m.mood_score, 0) /
          moodOnNonExerciseDays.length;

        if (avgMoodWithExercise > avgMoodWithoutExercise + 1) {
          insights.push({
            id: generateId('correlation_insight'),
            user_id: userId,
            insight_type: "correlation",
            category: "mood",
            title: "Exercise Boosts Your Mood",
            description: `Your mood is ${Math.round(((avgMoodWithExercise - avgMoodWithoutExercise) / avgMoodWithoutExercise) * 100)}% better on days when you exercise.`,
            confidence_score: 0.7,
            data_points: [
              {
                mood_with_exercise: avgMoodWithExercise,
                mood_without_exercise: avgMoodWithoutExercise,
              },
            ],
            action_items: [
              "Try to exercise regularly for better mood",
              "Consider morning workouts for all-day benefits",
            ],
            is_read: false,
            priority: 4,
            created_at: Date.now(),
          });
        }
      }
    }

    return (insights.results || []);
  }

  private async generateRecommendationInsights(
    userId: string,
    data: any
  ): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];

    // Hydration recommendations
    const hydrationLogs = data.healthLogs.filter(
      (log) => log.type === "hydration"
    );
    if (hydrationLogs.length >= 7) {
      const avgDailyWater =
        hydrationLogs.reduce((sum: number, log: any) => {
          const payload =
            typeof log.payload === "string"
              ? JSON.parse(log.payload)
              : log.payload;
          return sum + (payload.amount_ml || 0);
        }, 0) / 7;

      if (avgDailyWater < 2000) {
        insights.push({
          id: generateId('recommendation_insight'),
          user_id: userId,
          insight_type: "recommendation",
          category: "hydration",
          title: "Increase Water Intake",
          description: `You're averaging ${Math.round(avgDailyWater)}ml of water daily. Consider increasing to 2000ml for optimal hydration.`,
          confidence_score: 0.8,
          data_points: [{ current_avg: avgDailyWater, recommended: 2000 }],
          action_items: [
            "Set hourly water reminders",
            "Keep a water bottle nearby",
            "Track water intake more consistently",
          ],
          is_read: false,
          priority: 3,
          created_at: Date.now(),
        });
      }
    }

    return (insights.results || []);
  }

  // ========== DASHBOARD CREATION ==========

  async createHealthDashboard(userId: string): Promise<DashboardWidget[]> {
    const widgets: DashboardWidget[] = [];
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    try {
      // Health Goals Progress Widget
      const activeGoals = await this.getHealthGoals(userId, "active");
      if (activeGoals.length > 0) {
        widgets.push({
          id: generateId('goal_widget'),
          type: "goal_progress",
          title: "Health Goals Progress",
          data: activeGoals.slice(0, 3), // Top 3 goals
          position: { x: 0, y: 0, width: 6, height: 4 },
          config: { showProgress: true, showDeadlines: true },
        });
      }

      // Recent Insights Widget
      const recentInsightsResult = await this.env.DB.prepare(
        `
        SELECT * FROM health_insights 
        WHERE user_id = ? AND created_at >= ?
        ORDER BY priority DESC, created_at DESC
        LIMIT 5
      `
      )
        .bind(userId, thirtyDaysAgo)
        .all();

      const recentInsights = recentInsightsResult.results || [];
      if (recentInsights.length > 0) {
        widgets.push({
          id: generateId('insights_widget'),
          type: "insights",
          title: "Health Insights",
          data: recentInsights.map((insight) => ({
            ...insight,
            data_points:
              typeof insight.data_points === "string"
                ? JSON.parse(insight.data_points)
                : insight.data_points || [],
            action_items:
              typeof insight.action_items === "string"
                ? JSON.parse(insight.action_items)
                : insight.action_items || [],
          })),
          position: { x: 6, y: 0, width: 6, height: 4 },
          config: { showPriority: true, maxItems: 5 },
        });
      }

      // Activity Streak Widget
      const totalLoggedDays = await this.env.DB.prepare(
        `
        SELECT COUNT(DISTINCT DATE(datetime(recorded_at/1000, 'unixepoch'))) as count 
        FROM health_logs WHERE user_id = ?
      `
      )
        .bind(userId)
        .first();

      widgets.push({
        id: generateId('streak_widget'),
        type: "streak",
        title: "Health Tracking Streak",
        data: { streak_days: totalLoggedDays?.count || 0 },
        position: { x: 0, y: 4, width: 3, height: 2 },
        config: { showBadges: true },
      });

      // Nutrition Score Widget (if available)
      const latestNutritionAnalysis = await this.env.DB.prepare(
        `
        SELECT * FROM nutrition_analysis 
        WHERE user_id = ? 
        ORDER BY analysis_date DESC 
        LIMIT 1
      `
      )
        .bind(userId)
        .first();

      if (latestNutritionAnalysis) {
        widgets.push({
          id: generateId('nutrition_widget'),
          type: "metric",
          title: "Nutrition Score",
          data: {
            score: latestNutritionAnalysis.nutritional_score,
            max_score: 10,
            recommendations:
              typeof latestNutritionAnalysis.recommendations === "string"
                ? JSON.parse(latestNutritionAnalysis.recommendations)
                : latestNutritionAnalysis.recommendations || [],
          },
          position: { x: 3, y: 4, width: 3, height: 2 },
          config: { showRecommendations: true, scoreType: "nutrition" },
        });
      }

      return (widgets.results || []);
    } catch (error) {
      console.error("Dashboard creation failed:", { userId, error });
      return (widgets.results || []);
    }
  }

  // ========== UTILITY METHODS ==========

  async getHealthInsights(
    userId: string,
    category?: string,
    limit = 10
  ): Promise<HealthInsight[]> {
    let query = "SELECT * FROM health_insights WHERE user_id = ?";
    const params = [userId];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY priority DESC, created_at DESC LIMIT ?";
    params.push(limit.toString());

    const result = await this.env.DB.prepare(query)
      .bind(...params)
      .all();
    const insights = result.results || [];

    return insights.map((insight: any) => ({
      ...insight,
      data_points:
        typeof insight.data_points === "string"
          ? JSON.parse(insight.data_points)
          : insight.data_points || [],
      action_items:
        typeof insight.action_items === "string"
          ? JSON.parse(insight.action_items)
          : insight.action_items || [],
    })) as HealthInsight[];
  }

  async markInsightAsRead(insightId: string, userId: string): Promise<void> {
    await this.env.DB.prepare(
      `
      UPDATE health_insights 
      SET is_read = ? 
      WHERE id = ? AND user_id = ?
    `
    )
      .bind(true, insightId, userId)
      .run();
  }

  async dismissInsight(insightId: string, userId: string): Promise<void> {
    await this.env.DB.prepare(
      `
      UPDATE health_insights 
      SET is_dismissed = ? 
      WHERE id = ? AND user_id = ?
    `
    )
      .bind(true, insightId, userId)
      .run();
  }
}
