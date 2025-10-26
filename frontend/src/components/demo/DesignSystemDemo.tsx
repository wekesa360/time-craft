import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardAction,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Progress,
  CircularProgress
} from '../ui';
import { 
  Heart, 
  Dumbbell, 
  Target, 
  Plus, 
  TrendingUp,
  Flame,
  Droplets,
  Brain,
  CheckCircle2,
  Circle
} from 'lucide-react';

export function DesignSystemDemo() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [habitCompleted, setHabitCompleted] = useState(false);

  const moods = [
    { emoji: "😊", label: "Happy", color: "bg-yellow-100" },
    { emoji: "😐", label: "Neutral", color: "bg-stone-200" },
    { emoji: "😢", label: "Sad", color: "bg-blue-100" },
    { emoji: "😍", label: "Excited", color: "bg-pink-100" },
  ];

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar size="lg">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>DS</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Design System Demo</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">v0-fitness-app-ui Components</p>
              </div>
            </div>
          </div>
        </header>

        {/* Component Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          
          {/* Buttons Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full">Primary Button</Button>
                <Button variant="secondary" className="w-full">Secondary Button</Button>
                <Button variant="outline" className="w-full">Outline Button</Button>
                <Button variant="ghost" className="w-full">Ghost Button</Button>
                <div className="flex gap-2">
                  <Button size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Target className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="destructive">Error</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="orange">Orange</Badge>
                  <Badge variant="purple">Purple</Badge>
                  <Badge variant="blue">Blue</Badge>
                  <Badge variant="green">Green</Badge>
                  <Badge variant="pink">Pink</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Linear Progress</p>
                  <Progress value={75} className="mb-2" />
                  <Progress value={45} variant="success" className="mb-2" />
                  <Progress value={30} variant="warning" />
                </div>
                <div className="flex justify-center">
                  <CircularProgress value={68} size={100}>
                    <div className="text-center">
                      <p className="text-2xl font-bold">68%</p>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                  </CircularProgress>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mood Tracker Demo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>Mood Tracker</CardTitle>
              </div>
              <CardAction>
                <Button size="icon" variant="ghost" className="rounded-full">
                  <Plus className="w-5 h-5" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">How are you feeling?</p>
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
            </CardContent>
          </Card>

          {/* Stats Demo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>Today's Stats</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                  <p className="text-2xl font-bold text-orange-700">312</p>
                  <p className="text-xs text-orange-600">Calories</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <p className="text-2xl font-bold text-blue-700">8.2k</p>
                  <p className="text-xs text-blue-600">Steps</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                  <p className="text-2xl font-bold text-green-700">45m</p>
                  <p className="text-xs text-green-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Habit Tracker Demo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-pink-600" />
                </div>
                <CardTitle>Daily Habits</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div
                  className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer ${
                    habitCompleted ? "bg-primary/10 border border-primary/20" : "bg-white/50 hover:bg-white/70"
                  }`}
                  onClick={() => setHabitCompleted(!habitCompleted)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 border flex items-center justify-center">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Morning Meditation</p>
                      <p className="text-xs text-muted-foreground">7 day streak</p>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary/10">
                    {habitCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}