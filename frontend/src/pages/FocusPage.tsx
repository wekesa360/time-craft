"use client"

import { useState, useEffect } from "react"
import { Play, Pause, RotateCcw, TrendingUp, Clock, Target } from "lucide-react"
import { useFocusDashboardQuery, useFocusAnalyticsQuery, useFocusSessionsQuery } from "../hooks/queries/useFocusQueries"

export default function FocusPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(25 * 60)

  // Fetch real data from backend
  const { data: dashboardData } = useFocusDashboardQuery()
  const { data: analyticsData } = useFocusAnalyticsQuery('7d')
  
  // Get today's sessions for quick start tasks
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const { data: todaySessions } = useFocusSessionsQuery({
    startDate: today.getTime(),
    endDate: tomorrow.getTime(),
    limit: 5
  })

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && time > 0) {
      interval = setInterval(() => setTime((t) => t - 1), 1000)
    } else if (time === 0) {
      setIsRunning(false)
    }
    return () => clearInterval(interval)
  }, [isRunning, time])

  const minutes = Math.floor(time / 60)
  const seconds = time % 60

  // Debug logging
  useEffect(() => {
    console.log('FocusPage loaded data:', {
      dashboardData,
      analyticsData,
      todaySessions,
      todaySessionsCount: todaySessions?.length || 0
    })
  }, [dashboardData, analyticsData, todaySessions])

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Focus Timer</h1>
        <p className="text-muted-foreground mt-1">Deep work sessions with Pomodoro technique</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-8 md:p-12 border border-border">
          <div className="max-w-md mx-auto">
            {/* Timer Display */}
            <div className="relative mb-8">
              <div className="w-64 h-64 md:w-80 md:h-80 mx-auto rounded-full bg-white dark:bg-slate-800 border-8 border-primary flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-6xl md:text-7xl font-bold text-foreground font-mono">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Focus Session</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg"
              >
                {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              <button
                onClick={() => setTime(25 * 60)}
                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <RotateCcw className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Preset Durations */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "15 min", value: 15 },
                { label: "25 min", value: 25 },
                { label: "45 min", value: 45 },
                { label: "90 min", value: 90 },
              ].map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setTime(preset.value * 60)
                    setIsRunning(false)
                  }}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    time === preset.value * 60
                      ? "bg-primary text-primary-foreground"
                      : "bg-white dark:bg-slate-800 border border-border hover:border-primary text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats & Tasks */}
        <div className="space-y-6">
          {/* Today's Focus */}
          {(() => {
            const sessions = dashboardData?.total_sessions || 0
            const totalMinutes = dashboardData?.total_focus_minutes || 0
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60
            const displayTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
            
            return (
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h2 className="text-lg font-bold text-foreground mb-4">Today's Focus</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sessions</span>
                    <span className="text-2xl font-bold text-foreground">{sessions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Time</span>
                    <span className="text-2xl font-bold text-foreground">{displayTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Goal Progress</span>
                    <span className="text-2xl font-bold text-primary">
                      {dashboardData?.goal_progress || 0}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <TrendingUp className="w-4 h-4" />
                    <span>
                      {dashboardData?.trend ? `+${dashboardData.trend}% from yesterday` : 'No data yet'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Recent Sessions */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4">Recent Sessions</h2>

            <div className="space-y-2">
              {todaySessions && todaySessions.length > 0 ? (
                todaySessions.slice(0, 3).map((session: any) => {
                  const durationMinutes = Math.floor((session.duration || 0) / 60)
                  const durationHours = Math.floor(durationMinutes / 60)
                  const durationText = durationHours > 0 
                    ? `${durationHours}h ${durationMinutes % 60}m`
                    : `${durationMinutes}m`
                  
                  return (
                    <button
                      key={session.id}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border border-border hover:border-primary transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {session.template_key || 'Focus Session'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{durationText}</span>
                    </button>
                  )
                })
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No focus sessions today
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Focus Analytics */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-6">Weekly Focus Analytics</h2>

        {(() => {
          // Calculate weekly data from analytics
          const weeklyHours = [0, 0, 0, 0, 0, 0, 0] // Sunday = 0, Monday = 1, etc.
          const weeklySessions = [0, 0, 0, 0, 0, 0, 0]
          
          if (analyticsData?.focus_sessions) {
            analyticsData.focus_sessions.forEach((session: any) => {
              const sessionDate = new Date(session.started_at || session.created_at)
              const dayOfWeek = sessionDate.getDay()
              const hours = session.actual_duration ? session.actual_duration / 60 : 0
              
              weeklyHours[dayOfWeek] += hours
              weeklySessions[dayOfWeek] += 1
            })
          }
          
          const maxHours = Math.max(...weeklyHours, 1)
          
          // Calculate weekly stats
          const totalSessions = weeklySessions.reduce((a, b) => a + b, 0)
          const totalHours = weeklyHours.reduce((a, b) => a + b, 0)
          const avgSessionMinutes = totalSessions > 0 
            ? Math.round((totalHours * 60) / totalSessions) 
            : 0
          const avgSessionHours = Math.floor(avgSessionMinutes / 60)
          const avgSessionMins = avgSessionMinutes % 60
          const avgSessionText = avgSessionHours > 0 
            ? `${avgSessionHours}h ${avgSessionMins}m`
            : `${avgSessionMins}m`
          
          return (
            <>
              <div className="grid md:grid-cols-7 gap-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => {
                  const hours = weeklyHours[i]
                  const heightPercent = maxHours > 0 ? (hours / maxHours) * 100 : 0
                  
                  return (
                    <div key={day} className="flex flex-col items-center">
                      <div className="w-full h-32 bg-muted rounded-lg relative overflow-hidden mb-2">
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{day}</span>
                      <span className="text-xs text-foreground font-bold">{hours.toFixed(1)}h</span>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border">
                  <Clock className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Session</p>
                    <p className="text-xl font-bold text-foreground">{avgSessionText}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border">
                  <Target className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                    <p className="text-xl font-bold text-foreground">{totalSessions}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border">
                  <TrendingUp className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Weekly Total</p>
                    <p className="text-xl font-bold text-foreground">{totalHours.toFixed(1)}h</p>
                  </div>
                </div>
              </div>
            </>
          )
        })()}
      </div>
      </div>
    </div>
  )
}