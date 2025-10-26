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
  Bell,
  Settings,
  Smile,
  Frown,
  Meh,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { CircularProgress } from "../components/ui/Progress";

export default function Dashboard() {
  const { user } = useAuthStore();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const moods = [
    { icon: Smile, label: "Happy", color: "bg-yellow-100", emoji: "😊" },
    { icon: Meh, label: "Neutral", color: "bg-stone-200", emoji: "😐" },
    { icon: Frown, label: "Sad", color: "bg-blue-100", emoji: "😢" },
    { icon: Heart, label: "Excited", color: "bg-pink-100", emoji: "😍" },
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



  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="max-w-[1600px] mx-auto mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar size="lg">
              <AvatarImage src="/fit-woman-portrait.png" />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Welcome back, {user?.email?.split("@")[0] || "User"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Thursday, April 17th 2025
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full hover:bg-card"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full hover:bg-card"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="relative max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {/* Mood & Mental Wellness Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>Mood Tracker</CardTitle>
            </div>
            <CardAction>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full hover:bg-muted"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              How are you feeling today?
            </p>

            {/* Mood Selection */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => setSelectedMood(mood.label)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                    selectedMood === mood.label
                      ? "bg-primary text-primary-foreground scale-105"
                      : `${mood.color} hover:opacity-80`
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-medium">{mood.label}</span>
                </button>
              ))}
            </div>

            {/* Weekly Mood Chart */}
            <div className="bg-white/50 rounded-2xl p-4 mb-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                This Week's Mood
              </h3>
              <div className="flex items-end justify-between gap-2 h-24">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, i) => (
                    <div
                      key={day}
                      className="flex flex-col items-center gap-1 flex-1"
                    >
                      <div
                        className="w-full bg-primary rounded-lg transition-all hover:bg-primary/80"
                        style={{
                          height: `${[60, 80, 45, 90, 70, 55, 40][i]}%`,
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {day.slice(0, 1)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Mental Health Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                <p className="text-2xl font-bold text-purple-700">120</p>
                <p className="text-xs text-purple-600">Focus Min</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-3 border border-pink-100">
                <p className="text-2xl font-bold text-pink-700">26x</p>
                <p className="text-xs text-pink-600">Breathing</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-2xl font-bold text-blue-700">75</p>
                <p className="text-xs text-blue-600">Sleep Hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workout & Fitness Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>Today's Workout</CardTitle>
            </div>
            <CardAction>
              <div className="flex items-center gap-1.5 bg-white/50 rounded-full px-3 py-1.5 border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary">
                  124 kcal
                </span>
              </div>
            </CardAction>
          </CardHeader>

          <CardContent>
            {/* Time and Type */}
            <div className="mb-4">
              <div className="text-4xl font-bold mb-1">
                2:35{" "}
                <span className="text-xl font-normal text-muted-foreground">
                  pm
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Lower Body • 20 min
              </p>
            </div>

            {/* Progress Tags */}
            <div className="flex gap-2 mb-5">
              <Badge variant="purple">Stretch +8%</Badge>
              <Badge variant="blue">Endurance +4%</Badge>
            </div>

            {/* Exercise List */}
            <div className="space-y-2">
              {[
                {
                  name: "Warm up",
                  time: "5:00",
                  icon: Activity,
                  color: "bg-green-50 text-green-700 border-green-100",
                },
                {
                  name: "Squats",
                  weight: "120kg",
                  reps: "3x12",
                  icon: Dumbbell,
                  color: "bg-orange-50 text-orange-700 border-orange-100",
                },
                {
                  name: "Lunges",
                  weight: "60kg",
                  reps: "4x20",
                  icon: Activity,
                  color: "bg-blue-50 text-blue-700 border-blue-100",
                },
              ].map((exercise, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white/50 rounded-xl hover:bg-white/70"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full ${exercise.color} border flex items-center justify-center`}
                    >
                      <exercise.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{exercise.name}</p>
                      {exercise.weight && (
                        <p className="text-xs text-muted-foreground">
                          {exercise.weight}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-sm">
                    {exercise.time || exercise.reps}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-secondary" />
              </div>
              <CardTitle>Nutrition</CardTitle>
            </div>
            <CardAction>
              <Button
                variant="ghost"
                className="text-xs h-8 px-3 rounded-full hover:bg-muted"
              >
                Week <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            {/* Calorie Progress */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl font-bold">1,320</span>
                <span className="text-muted-foreground">/2300 kcal</span>
              </div>

              <div className="flex items-center gap-6">
                {/* Circular Progress */}
                <CircularProgress value={64} size={120}>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Day 8</p>
                    <p className="text-2xl font-bold">64%</p>
                    <p className="text-xs text-green-600">+3%</p>
                  </div>
                </CircularProgress>

                {/* Macros */}
                <div className="space-y-2 flex-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      <span className="text-xs text-muted-foreground">
                        Carbs
                      </span>
                    </div>
                    <p className="text-lg font-bold">
                      112
                      <span className="text-sm text-muted-foreground">
                        /240g
                      </span>
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <span className="text-xs text-muted-foreground">
                        Proteins
                      </span>
                    </div>
                    <p className="text-lg font-bold">
                      48
                      <span className="text-sm text-muted-foreground">
                        /140g
                      </span>
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                      <span className="text-xs text-muted-foreground">
                        Fats
                      </span>
                    </div>
                    <p className="text-lg font-bold">
                      32
                      <span className="text-sm text-muted-foreground">
                        /110g
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Habits Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-pink-600" />
              </div>
              <CardTitle>Daily Habits</CardTitle>
            </div>
            <CardAction>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full hover:bg-muted"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            {/* Habit List */}
            <div className="space-y-3 mb-5">
              {habits.map((habit, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    habit.completed
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-white/50 hover:bg-white/70"
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
              <h3 className="text-sm font-semibold mb-3">
                This Week's Progress
              </h3>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
