import React, { useState, useEffect } from 'react';
import type { FocusSession, SessionTemplate } from '../../../types';
import { 
  Coffee,
  Clock
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
    if (!activeSession || activeSession.completed_at) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const sessionEndTime = activeSession.started_at + (activeSession.planned_duration * 60 * 1000);
      const remaining = Math.max(0, sessionEndTime - now);
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
    if (activeSession && !activeSession.completed_at) {
      const now = Date.now();
      const sessionEndTime = activeSession.started_at + (activeSession.planned_duration * 60 * 1000);
      const remaining = Math.max(0, sessionEndTime - now);
      setTimeLeft(remaining);
    } else if (!activeSession || activeSession.completed_at) {
      // Reset timer when no active session or session is completed
      setTimeLeft(0);
      setShowCompletionModal(false); // Reset modal when session ends
    }
  }, [activeSession]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!activeSession) return 0;
    const totalTime = activeSession.planned_duration * 60 * 1000;
    const elapsed = totalTime - timeLeft;
    return Math.min(100, (elapsed / totalTime) * 100);
  };

  const handleStartSession = () => {
    if (selectedTemplate) {
      onStartSession(selectedTemplate.template_key);
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
                  Focus Time
                </div>
              </div>
            </div>

            {/* Session Info */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                {activeSession.session_name || activeSession.session_type}
              </h3>
              <p className="text-foreground-secondary">
                Stay focused and avoid distractions
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button onClick={onPauseSession} className="btn btn-secondary">
                Pause
              </button>
              <button onClick={onCancelSession} className="btn btn-secondary text-red-600 hover:text-red-700">
                Stop
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* No Active Session */}
            <div className="w-64 h-64 mx-auto flex items-center justify-center border-2 border-dashed border-border rounded-full">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-primary-600" />
                </div>
                <p className="text-foreground-secondary text-lg font-medium">Ready to focus?</p>
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
                    <span>{selectedTemplate.duration_minutes}m focus</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Coffee className="w-4 h-4" />
                    <span>{selectedTemplate.break_duration_minutes}m break</span>
                  </div>
                </div>
              </div>
            )}

            {/* Start Button */}
            <button 
              onClick={handleStartSession}
              disabled={!selectedTemplate}
              className="btn btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Focus Session
            </button>
          </div>
        )}
      </div>


      {/* Session Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-background card max-w-lg w-full">
            <div className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-foreground mb-3">
                  Session Complete!
                </h3>
              </div>

              {/* Rating */}
              <div className="mb-8">
                <label className="block text-base font-medium text-foreground mb-4 text-center">
                  Productivity Rating
                </label>
                <div className="flex items-center justify-center space-x-2 flex-wrap gap-y-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setRating(value)}
                      className={`w-10 h-10 rounded-full border-2 text-sm font-medium transition-all duration-200 ${
                        rating >= value
                          ? 'bg-primary-600 border-primary-600 text-white scale-110'
                          : 'border-border text-foreground-secondary hover:border-primary-300 hover:scale-105'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <span className="text-sm text-foreground-secondary">
                    {rating === 1 && 'Very Low'}
                    {rating === 2 && 'Low'}
                    {rating === 3 && 'Average'}
                    {rating === 4 && 'Good'}
                    {rating === 5 && 'Excellent'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <label className="block text-base font-medium text-foreground mb-3 text-center">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input w-full h-24 resize-none"
                  placeholder="How did the session go? Any insights or reflections?"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="btn btn-secondary flex-1 py-3 text-base"
                >
                  Skip
                </button>
                <button
                  onClick={handleCompleteSession}
                  className="btn btn-primary flex-1 py-3 text-base"
                >
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