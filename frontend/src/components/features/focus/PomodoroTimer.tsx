import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, Settings, Clock } from 'lucide-react';

interface PomodoroTimerProps {
  workDuration?: number; // in minutes
  breakDuration?: number; // in minutes
  longBreakDuration?: number; // in minutes
  autoStartBreaks?: boolean;
  autoStartPomodoros?: boolean;
  className?: string;
}

type TimerState = 'work' | 'shortBreak' | 'longBreak' | 'paused';

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  workDuration = 25,
  breakDuration = 5,
  longBreakDuration = 15,
  autoStartBreaks = false,
  autoStartPomodoros = false,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [timerState, setTimerState] = useState<TimerState>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const durations = {
    work: workDuration * 60,
    shortBreak: breakDuration * 60,
    longBreak: longBreakDuration * 60
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (timerState === 'work') {
      setCompletedPomodoros(prev => prev + 1);
      if (autoStartBreaks) {
        const nextBreak = completedPomodoros + 1 >= 4 ? 'longBreak' : 'shortBreak';
        setTimerState(nextBreak);
        setTimeLeft(durations[nextBreak]);
        setIsRunning(true);
      } else {
        setTimerState('shortBreak');
        setTimeLeft(durations.shortBreak);
      }
    } else {
      if (autoStartPomodoros) {
        setTimerState('work');
        setTimeLeft(durations.work);
        setIsRunning(true);
      } else {
        setTimerState('work');
        setTimeLeft(durations.work);
      }
    }
  };

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[timerState]);
  };

  const switchToWork = () => {
    setTimerState('work');
    setTimeLeft(durations.work);
    setIsRunning(false);
  };

  const switchToShortBreak = () => {
    setTimerState('shortBreak');
    setTimeLeft(durations.shortBreak);
    setIsRunning(false);
  };

  const switchToLongBreak = () => {
    setTimerState('longBreak');
    setTimeLeft(durations.longBreak);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateColor = () => {
    switch (timerState) {
      case 'work':
        return 'text-primary';
      case 'shortBreak':
        return 'text-primary';
      case 'longBreak':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStateBgColor = () => {
    switch (timerState) {
      case 'work':
        return 'bg-primary/10 border-primary/20';
      case 'shortBreak':
        return 'bg-primary/10 border-primary/20';
      case 'longBreak':
        return 'bg-primary/10 border-primary/20';
      default:
        return 'bg-muted border-border';
    }
  };

  const getProgressPercentage = () => {
    const total = durations[timerState];
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <div className={`bg-card rounded-lg border border-border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Pomodoro Timer</h3>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className={`p-8 ${getStateBgColor()}`}>
        <div className="text-center">
          {/* Progress Circle */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted-foreground"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)}`}
                className={`transition-all duration-1000 ${getStateColor()}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getStateColor()}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className={`text-sm font-medium ${getStateColor()}`}>
                  {timerState === 'work' ? 'Focus Time' : 
                   timerState === 'shortBreak' ? 'Short Break' : 'Long Break'}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              className="flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isRunning ? 'Pause' : 'Start'}</span>
            </button>
            
            <button
              onClick={resetTimer}
              className="flex items-center space-x-2 px-4 py-3 text-muted-foreground hover:text-foreground border border-border rounded-lg font-medium transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="p-6">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={switchToWork}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              timerState === 'work'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Work ({workDuration}m)
          </button>
          <button
            onClick={switchToShortBreak}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              timerState === 'shortBreak'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Break ({breakDuration}m)
          </button>
          <button
            onClick={switchToLongBreak}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              timerState === 'longBreak'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Long Break ({longBreakDuration}m)
          </button>
        </div>

        {/* Stats */}
        <div className="text-center text-sm text-muted-foreground">
          Completed Pomodoros: <span className="font-semibold text-primary">{completedPomodoros}</span>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
