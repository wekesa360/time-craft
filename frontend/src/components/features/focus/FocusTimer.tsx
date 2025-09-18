import React, { useState, useEffect } from 'react';
import type { FocusSession, SessionTemplate } from '../../../types';
import { 
  Play, 
  Pause, 
  Square, 
  Coffee,
  Target,
  Clock,
  Star,
  MessageSquare
} from 'lucide-react';

interface FocusTimerProps {
  activeSession: FocusSession | null;
  selectedTemplate: SessionTemplate | null;
  templates: SessionTemplate[];
  onStartSession: (templateKey: string, taskId?: string) => void;
  onCompleteSession: (rating: number, notes?: string) => void;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onCancelSession: () => void;
}

const FocusTimer: React.FC<FocusTimerProps> = ({
  activeSession,
  selectedTemplate,
  templates,
  onStartSession,
  onCompleteSession,
  onPauseSession,
  onResumeSession,
  onCancelSession
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');

  // Calculate time left
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, activeSession.plannedEndTime - now);
      setTimeLeft(remaining);

      // Auto-complete when time runs out
      if (remaining === 0) {
        setShowCompletionModal(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Initialize time left when session starts
  useEffect(() => {
    if (activeSession && activeSession.status === 'active') {
      const now = Date.now();
      const remaining = Math.max(0, activeSession.plannedEndTime - now);
      setTimeLeft(remaining);
    }
  }, [activeSession]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!activeSession || !selectedTemplate) return 0;
    const totalTime = selectedTemplate.focusDuration * 60 * 1000;
    const elapsed = totalTime - timeLeft;
    return Math.min(100, (elapsed / totalTime) * 100);
  };

  const handleStartSession = () => {
    if (selectedTemplate) {
      onStartSession(selectedTemplate.key);
    }
  };

  const handleCompleteSession = () => {
    onCompleteSession(rating, notes);
    setShowCompletionModal(false);
    setRating(5);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Main Timer Display */}
      <div className="card p-8 text-center">
        {activeSession ? (
          <div className="space-y-6">
            {/* Timer Circle */}
            <div className="relative w-64 h-64 mx-auto">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-border"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                  className="text-primary-600 transition-all duration-1000 ease-linear"
                />
              </svg>
              
              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-foreground">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-foreground-secondary mt-2">
                  {activeSession.status === 'paused' ? 'Paused' : 'Focus Time'}
                </div>
              </div>
            </div>

            {/* Session Info */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                {templates.find(t => t.key === activeSession.templateKey)?.name}
              </h3>
              <p className="text-foreground-secondary">
                Stay focused and avoid distractions
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              {activeSession.status === 'active' ? (
                <button onClick={onPauseSession} className="btn-outline">
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </button>
              ) : (
                <button onClick={onResumeSession} className="btn-primary">
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </button>
              )}
              <button onClick={onCancelSession} className="btn-outline text-red-600">
                <Square className="w-5 h-5 mr-2" />
                Stop
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* No Active Session */}
            <div className="w-64 h-64 mx-auto flex items-center justify-center border-2 border-dashed border-border rounded-full">
              <div className="text-center">
                <Target className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
                <p className="text-foreground-secondary">Ready to focus?</p>
              </div>
            </div>

            {/* Template Selection */}
            {selectedTemplate && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  {selectedTemplate.name}
                </h3>
                <p className="text-foreground-secondary">
                  {selectedTemplate.description}
                </p>
                <div className="flex items-center justify-center space-x-6 text-sm text-foreground-secondary">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{selectedTemplate.focusDuration}m focus</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Coffee className="w-4 h-4" />
                    <span>{selectedTemplate.shortBreakDuration}m break</span>
                  </div>
                </div>
              </div>
            )}

            {/* Start Button */}
            <button 
              onClick={handleStartSession}
              disabled={!selectedTemplate}
              className="btn-primary text-lg px-8 py-3"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Focus Session
            </button>
          </div>
        )}
      </div>

      {/* Template Quick Select */}
      {!activeSession && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Start Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.slice(0, 3).map((template) => (
              <button
                key={template.key}
                onClick={() => onStartSession(template.key)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTemplate?.key === template.key
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                    : 'border-border hover:border-primary-300 hover:bg-background-secondary'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  <h4 className="font-medium text-foreground">{template.name}</h4>
                </div>
                <p className="text-sm text-foreground-secondary mb-3">
                  {template.description}
                </p>
                <div className="flex items-center space-x-4 text-xs text-foreground-secondary">
                  <span>{template.focusDuration}m</span>
                  <span>•</span>
                  <span>{template.shortBreakDuration}m break</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Session Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background card max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-950/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-2">
                🎉 Session Complete!
              </h3>
              <p className="text-foreground-secondary mb-6">
                Great job! How productive was this session?
              </p>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Productivity Rating
                </label>
                <div className="flex items-center justify-center space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <button
                      key={value}
                      onClick={() => setRating(value)}
                      className={`w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors ${
                        rating >= value
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-border text-foreground-secondary hover:border-primary-300'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input w-full h-20 resize-none"
                  placeholder="How did the session go? Any insights?"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="btn-secondary flex-1"
                >
                  Skip
                </button>
                <button
                  onClick={handleCompleteSession}
                  className="btn-primary flex-1"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Complete Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusTimer;