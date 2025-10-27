import { useAuthStore } from "../stores/auth";
import {
  Activity,
  Flame,
  TrendingUp,
  Target,
  Heart,
  Droplets,
  ChevronRight,
  Plus,
  Brain,
  Dumbbell,
  CheckCircle2,
  Circle,
  Footprints,
  Clock,
  Moon,
  Trophy,
  CalendarIcon,
  CheckSquare,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuthStore();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);

  // Fetch today's tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['dashboard', 'tasks'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return apiClient.getTasks({
        startDate: today.getTime(),
        endDate: tomorrow.getTime(),
        status: 'pending',
        limit: 4,
        sort: 'priority'
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch task statistics
  const { data: taskStats } = useQuery({
    queryKey: ['dashboard', 'task-stats'],
    queryFn: () => apiClient.getTaskStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch health summary
  const { data: healthSummary } = useQuery({
    queryKey: ['dashboard', 'health-summary'],
    queryFn: () => apiClient.getHealthSummary(7), // 7 days
    staleTime: 5 * 60 * 1000,
  });

  // Fetch health logs for today
  const { data: todayHealthLogs } = useQuery({
    queryKey: ['dashboard', 'health-logs-today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return apiClient.getHealthLogs({
        startDate: today.getTime(),
        endDate: tomorrow.getTime(),
        limit: 10
      });
    },
    staleTime: 2 * 60 * 1000,
  });

  const tasks = tasksData?.data || [];
  const stats = taskStats || { total: 0, completed: 0, pending: 0, overdue: 0 };
  
  // Calculate today's health stats from logs
  const todayHealthStats = (() => {
    if (!todayHealthLogs?.data) return { calories: 0, exercises: 0, hydration: 0 };
    
    const exerciseLogs = todayHealthLogs.data.filter(log => log.type === 'exercise');
    const hydrationLogs = todayHealthLogs.data.filter(log => log.type === 'hydration');
    
    const totalCalories = exerciseLogs.reduce((sum, log) => {
      const payload = log.payload as any;
      return sum + (payload.calories_burned || 0);
    }, 0);
    
    const totalHydration = hydrationLogs.reduce((sum, log) => {
      const payload = log.payload as any;
      return sum + (payload.amount_ml || payload.amount || 0);
    }, 0);
    
    return {
      calories: totalCalories,
      exercises: exerciseLogs.length,
      hydration: Math.floor(totalHydration / 250) // Convert ml to glasses
    };
  })();
  
  // Calculate hydration from health data
  const waterIntake = todayHealthStats.hydration;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 21) return 'Evening';
    return 'Night';
  };

  const moods = [
    { emoji: "😊", label: "Happy", color: "bg-yellow-100 hover:bg-yellow-200" },
    { emoji: "😌", label: "Calm", color: "bg-blue-100 hover:bg-blue-200" },
    { emoji: "😤", label: "Stressed", color: "bg-red-100 hover:bg-red-200" },
    { emoji: "😴", label: "Tired", color: "bg-purple-100 hover:bg-purple-200" },
    {
      emoji: "😎",
      label: "Energized",
      color: "bg-orange-100 hover:bg-orange-200",
    },
    { emoji: "😐", label: "Neutral", color: "bg-gray-100 hover:bg-gray-200" },
  ];

  // Transform backend tasks to dashboard format
  const dashboardTasks = tasks.map(task => ({
    id: parseInt(task.id),
    title: task.title,
    time: task.dueDate ? format(new Date(task.dueDate), 'hh:mm a') : 'No time',
    priority: task.priority === 1 ? 'high' : task.priority === 2 ? 'medium' : 'low',
    icon: Target,
    color: task.priority === 1 ? 'red' : task.priority === 2 ? 'yellow' : 'gray',
    taskId: task.id // Store for API calls
  }));

  const handleTaskComplete = async (taskId: number) => {
    setCompletedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
    
    // Update task status in backend
    const task = dashboardTasks.find(t => t.id === taskId);
    if (task?.taskId) {
      try {
        await apiClient.completeTask(task.taskId);
      } catch (error) {
        console.error('Failed to complete task:', error);
        // Revert optimistic update
        setCompletedTasks((prev) =>
          prev.filter((id) => id !== taskId)
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header with avatar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            Good {getGreeting()}, {user?.firstName || user?.email?.split("@")[0] || "User"}
            <span className="text-4xl">👋</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM do yyyy')}
          </p>
        </div>
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl md:text-2xl font-bold shadow-lg">
          {user?.email?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-card-foreground">
            {todayHealthStats.calories}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Calories Today</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-orange-500 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>On track</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-card-foreground">
            {stats.pending}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Active Tasks</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-500 font-medium">
            <span>{stats.completed} completed</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-card-foreground">
            {todayHealthStats.exercises}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Workouts Today</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-green-500 font-medium">
            <span>{todayHealthStats.exercises > 0 ? 'Great!' : 'Let\'s go!'}</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Droplets className="w-6 h-6 text-cyan-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-card-foreground">
            {waterIntake}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Water Glasses</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-cyan-500 font-medium">
            <span>{waterIntake}/8 glasses</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              Today's Priority Tasks
            </h2>
            <Button
              variant="ghost"
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {tasksLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
          ) : dashboardTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tasks for today</div>
          ) : (
            <div className="space-y-3">
              {dashboardTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskComplete(task.id)}
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      task.color === "red"
                        ? "bg-red-100"
                        : task.color === "yellow"
                        ? "bg-yellow-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <task.icon
                      className={`w-5 h-5 md:w-6 md:h-6 ${
                        task.color === "red"
                          ? "text-red-500"
                          : task.color === "yellow"
                          ? "text-yellow-500"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm md:text-base truncate">
                      {task.title}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {task.time}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 transition-colors flex-shrink-0 flex items-center justify-center ${
                      completedTasks.includes(task.id)
                        ? "bg-primary border-primary"
                        : "border-border group-hover:border-primary"
                    }`}
                  >
                    {completedTasks.includes(task.id) && (
                      <svg
                        className="w-3 h-3 md:w-4 md:h-4 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Mood */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">
              How are you feeling?
            </h3>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {moods.map((mood, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedMood(mood.label)}
                  className={`${
                    mood.color
                  } rounded-xl p-2 md:p-3 hover:scale-105 transition-all active:scale-95 ${
                    selectedMood === mood.label ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="text-2xl md:text-3xl mb-1">{mood.emoji}</div>
                  <div className="text-[10px] md:text-xs font-medium text-foreground">
                    {mood.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">
                Water Intake
              </h3>
              <Droplets className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex items-end gap-1 mb-3 h-16">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-200 rounded-t-lg relative overflow-hidden"
                >
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all ${
                      i < waterIntake ? "bg-blue-400" : "bg-gray-200"
                    }`}
                    style={{ height: i < waterIntake ? '100%' : '20%' }}
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {waterIntake} / 8 glasses today
            </p>
            <Button
              as="a"
              href="/health"
              className="w-full"
              variant="default"
            >
              Log Water
            </Button>
          </div>

          <div className="bg-gradient-primary rounded-2xl p-4 md:p-6 shadow-lg text-white">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5" />
              <h3 className="text-lg font-bold">Current Streak</h3>
            </div>
            <p className="text-4xl font-bold mb-1">12 Days</p>
            <p className="text-sm opacity-90">Keep up the great work!</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-card-foreground">
            Weekly Health Overview
          </h2>
          <Button
            variant="ghost"
            className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1"
          >
            View details
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Active Minutes
              </span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-card-foreground">
              {healthSummary?.exerciseCount ? healthSummary.exerciseCount * 30 : 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {healthSummary?.exerciseCount || 0} workouts
            </p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${Math.min((healthSummary?.exerciseCount || 0) * 10, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Workouts
              </span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-card-foreground">
              {healthSummary?.exerciseCount || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${Math.min((healthSummary?.exerciseCount || 0) * 20, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Calories Burned
              </span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-card-foreground">
              {todayHealthStats.calories}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Today</p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${Math.min((todayHealthStats.calories / 1500) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-5 h-5 text-cyan-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Hydration
              </span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-card-foreground">
              {waterIntake}/8
            </p>
            <p className="text-xs text-muted-foreground mt-1">Glasses today</p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${Math.min((waterIntake / 8) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
    </div>
  );
}
