/**
 * Session Completion Modal Component
 * Celebration and feedback for completed focus sessions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { Button } from '../../ui';
import { FadeIn, ScaleIn } from '../../ui/animations';

interface SessionCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    duration: number; // in minutes
    type: 'focus' | 'break';
    templateName: string;
    distractions?: number;
  };
  onRateSession?: (rating: number, notes?: string) => void;
  onStartBreak?: () => void;
  onStartNextSession?: () => void;
  className?: string;
}

const celebrationMessages = {
  focus: [
    "🎉 Fantastic focus session!",
    "🔥 You're on fire!",
    "⭐ Amazing concentration!",
    "🚀 Productivity unlocked!",
    "💪 Focus champion!",
    "🎯 Bullseye focus!",
    "✨ Brilliant work!",
    "🏆 Focus master!",
  ],
  break: [
    "😌 Great break time!",
    "🌱 Refreshed and ready!",
    "☕ Well deserved rest!",
    "🧘 Mindful break complete!",
    "🌟 Recharged successfully!",
    "💆 Relaxation achieved!",
    "🌸 Peaceful break!",
    "🔋 Energy restored!",
  ],
};

const achievements = [
  { threshold: 25, message: "First Pomodoro complete!", icon: "🍅" },
  { threshold: 50, message: "Power session achieved!", icon: "⚡" },
  { threshold: 90, message: "Deep work master!", icon: "🧠" },
  { threshold: 120, message: "Focus marathon!", icon: "🏃‍♂️" },
];

const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  isOpen,
  onClose,
  sessionData,
  onRateSession,
  onStartBreak,
  onStartNextSession,
  className,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [celebrationPlayed, setCelebrationPlayed] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setNotes('');
      setShowRating(false);
      setCelebrationPlayed(false);
      
      // Show rating form after celebration
      const timer = setTimeout(() => {
        setShowRating(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Play celebration effect
  useEffect(() => {
    if (isOpen && !celebrationPlayed) {
      setCelebrationPlayed(true);
      // Could trigger confetti or other celebration effects here
    }
  }, [isOpen, celebrationPlayed]);

  const getRandomMessage = () => {
    const messages = celebrationMessages[sessionData.type];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getAchievement = () => {
    return achievements
      .filter(a => sessionData.duration >= a.threshold)
      .pop(); // Get the highest threshold achieved
  };

  const handleRateSession = () => {
    if (rating > 0) {
      onRateSession?.(rating, notes || undefined);
      onClose();
    }
  };

  const getProductivityFeedback = () => {
    if (sessionData.distractions === undefined) return null;
    
    if (sessionData.distractions === 0) {
      return {
        message: "Perfect focus! Zero distractions recorded.",
        color: "green",
        icon: "🎯"
      };
    } else if (sessionData.distractions <= 2) {
      return {
        message: `Great job! Only ${sessionData.distractions} distraction${sessionData.distractions > 1 ? 's' : ''} logged.`,
        color: "blue",
        icon: "👍"
      };
    } else if (sessionData.distractions <= 5) {
      return {
        message: `Good effort! ${sessionData.distractions} distractions - room for improvement.`,
        color: "yellow",
        icon: "💪"
      };
    } else {
      return {
        message: `${sessionData.distractions} distractions logged. Consider adjusting your environment.`,
        color: "orange",
        icon: "🔄"
      };
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const achievement = getAchievement();
  const productivityFeedback = getProductivityFeedback();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className={cn(
            'bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Celebration Header */}
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-t-2xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-6xl mb-4"
            >
              {sessionData.type === 'focus' ? '🎉' : '😌'}
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {getRandomMessage()}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-gray-600 dark:text-gray-300"
            >
              {sessionData.type === 'focus' ? 'Focus session' : 'Break'} completed: {formatDuration(sessionData.duration)}
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-gray-500 dark:text-gray-400 mt-1"
            >
              {sessionData.templateName}
            </motion.p>
          </div>

          <div className="p-6 space-y-6">
            {/* Achievement Badge */}
            {achievement && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4 text-center"
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  {achievement.message}
                </h3>
              </motion.div>
            )}

            {/* Productivity Feedback */}
            {productivityFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className={cn(
                  'rounded-lg border p-4',
                  productivityFeedback.color === 'green' && 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
                  productivityFeedback.color === 'blue' && 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
                  productivityFeedback.color === 'yellow' && 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
                  productivityFeedback.color === 'orange' && 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                )}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{productivityFeedback.icon}</span>
                  <p className={cn(
                    'text-sm font-medium',
                    productivityFeedback.color === 'green' && 'text-green-800 dark:text-green-200',
                    productivityFeedback.color === 'blue' && 'text-blue-800 dark:text-blue-200',
                    productivityFeedback.color === 'yellow' && 'text-yellow-800 dark:text-yellow-200',
                    productivityFeedback.color === 'orange' && 'text-orange-800 dark:text-orange-200'
                  )}>
                    {productivityFeedback.message}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Rating Section */}
            <AnimatePresence>
              {showRating && sessionData.type === 'focus' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    How productive was this session?
                  </h3>
                  
                  {/* Star Rating */}
                  <div className="flex justify-center space-x-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setRating(i + 1)}
                        className={cn(
                          'w-8 h-8 transition-all duration-200 hover:scale-110',
                          i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                        )}
                      >
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  
                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="How did the session go? Any insights?"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      rows={3}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              {sessionData.type === 'focus' && showRating && (
                <Button
                  onClick={handleRateSession}
                  disabled={rating === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {rating > 0 ? `Rate Session (${rating}/5)` : 'Select Rating First'}
                </Button>
              )}
              
              {sessionData.type === 'focus' && onStartBreak && (
                <Button
                  onClick={() => {
                    onStartBreak();
                    onClose();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Take a Break
                </Button>
              )}
              
              {sessionData.type === 'break' && onStartNextSession && (
                <Button
                  onClick={() => {
                    onStartNextSession();
                    onClose();
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Start Next Session
                </Button>
              )}
              
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                {sessionData.type === 'focus' && !showRating ? 'Continue' : 'Close'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SessionCompletionModal;