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

export default function Dashboard() {
  const { user } = useAuthStore();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [waterIntake, setWaterIntake] = useState(5);
  const [showWaterForm, setShowWaterForm] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);

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

  const tasks = [
    {
      id: 1,
      title: "Finish quarterly report",
      time: "10:00 AM",
      priority: "high",
      icon: Target,
      color: "red",
    },
    {
      id: 2,
      title: "Team standup meeting",
      time: "11:30 AM",
      priority: "medium",
      icon: CalendarIcon,
      color: "yellow",
    },
    {
      id: 3,
      title: "Review budget proposal",
      time: "2:00 PM",
      priority: "high",
      icon: Target,
      color: "red",
    },
    {
      id: 4,
      title: "Grocery shopping",
      time: "6:00 PM",
      priority: "low",
      icon: CheckSquare,
      color: "gray",
    },
  ];

  const habits = [
    {
      name: "Morning Meditation",
      streak: 7,
      completed: true,
      icon: Brain,
      color: "bg-purple-50",
    },
    {
      name: "Drink Water",
      streak: 12,
      completed: true,
      icon: Droplets,
      color: "bg-blue-50",
    },
    {
      name: "Exercise",
      streak: 5,
      completed: false,
      icon: Dumbbell,
      color: "bg-orange-50",
    },
    {
      name: "Read 30min",
      streak: 3,
      completed: false,
      icon: Target,
      color: "bg-green-50",
    },
  ];

  const handleTaskComplete = (taskId: number) => {
    setCompletedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleWaterLog = () => {
    if (waterIntake < 8) {
      setWaterIntake(waterIntake + 1);
    }
    setShowWaterForm(false);
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header with avatar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            Good Morning, {user?.email?.split("@")[0] || "User"}
            <span className="text-4xl">👋</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Thursday, April 17th 2025
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
            1,320
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
              <Footprints className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-card-foreground">
            8,234
          </p>
          <p className="text-sm text-muted-foreground mt-1">Steps Today</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-500 font-medium">
            <span>82% of goal</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-card-foreground">
            2h 15m
          </p>
          <p className="text-sm text-muted-foreground mt-1">Focus Time</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-purple-500 font-medium">
            <span>3 sessions</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Moon className="w-6 h-6 text-indigo-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-card-foreground">
            7h 22m
          </p>
          <p className="text-sm text-muted-foreground mt-1">Sleep Last Night</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-indigo-500 font-medium">
            <span>Good quality</span>
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

          <div className="space-y-3">
            {tasks.map((task) => (
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
              {[1, 1, 1, 1, 0.7, 0, 0, 0].map((fill, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-200 rounded-t-lg relative overflow-hidden"
                >
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all ${
                      i < waterIntake ? "bg-blue-400" : "bg-gray-200"
                    }`}
                    style={{ height: `${i < waterIntake ? 100 : fill * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {waterIntake} / 8 glasses today
            </p>
            <button
              onClick={() => setShowWaterForm(!showWaterForm)}
              className="w-full py-2.5 md:py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              Log Water
            </button>
            {showWaterForm && (
              <div className="mt-3 p-3 bg-muted/30 rounded-xl">
                <button
                  onClick={handleWaterLog}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
                >
                  Add Glass
                </button>
              </div>
            )}
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
              558
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: 80 min/day
            </p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: "75%" }}
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
              5
            </p>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: "71%" }}
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
              10,820
            </p>
            <p className="text-xs text-muted-foreground mt-1">Weekly total</p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: "88%" }}
              />
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Sleep Average
              </span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-card-foreground">
              7h 22m
            </p>
            <p className="text-xs text-muted-foreground mt-1">Per night</p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: "92%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Habits Section */}
      <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-pink-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Daily Habits</h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full hover:bg-muted"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Habit List */}
          <div className="space-y-3">
            {habits.map((habit, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  habit.completed
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${habit.color} border flex items-center justify-center`}
                  >
                    <habit.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{habit.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {habit.streak} day streak
                    </p>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary/10">
                  {habit.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Weekly Progress */}
          <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4">
            <h3 className="text-sm font-semibold mb-3">This Week's Progress</h3>
            <div className="grid grid-cols-7 gap-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
                      i < 4
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-muted-foreground"
                    }`}
                  >
                    {i < 4 ? "✓" : day}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
