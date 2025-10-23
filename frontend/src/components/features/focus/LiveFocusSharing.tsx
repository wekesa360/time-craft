/**
 * Live Focus Sharing Component
 * Real-time focus session sharing and encouragement
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { useSSEMessage, useFocusSessionUpdates } from '../../../hooks/useSSE';
import { Button } from '../../ui';
import { FadeIn, ScaleIn } from '../../ui/animations';

interface LiveFocusSession {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  sessionType: string;
  duration: number; // in minutes
  elapsed: number; // in seconds
  startTime: string;
  isActive: boolean;
  encouragements: Encouragement[];
}

interface Encouragement {
  id: string;
  fromUserId: string;
  fromUserName: string;
  message: string;
  emoji: string;
  timestamp: string;
}

interface LiveFocusSharingProps {
  currentUserId?: string;
  showEncouragement?: boolean;
  maxSessions?: number;
  className?: string;
}

const LiveFocusSharing: React.FC<LiveFocusSharingProps> = ({
  currentUserId,
  showEncouragement = true,
  maxSessions = 5,
  className,
}) => {
  const [liveSessions, setLiveSessions] = useState<LiveFocusSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LiveFocusSession | null>(null);
  const [encouragementMessage, setEncouragementMessage] = useState('');

  // Listen for live focus session updates
  useSSEMessage('live_focus_sessions', (sessions: LiveFocusSession[]) => {
    setLiveSessions(sessions.slice(0, maxSessions));
  });

  // Listen for encouragement messages
  useSSEMessage('focus_encouragement', (encouragement: { sessionId: string; encouragement: Encouragement }) => {
    setLiveSessions(prev => prev.map(session => 
      session.id === encouragement.sessionId
        ? { ...session, encouragements: [...session.encouragements, encouragement.encouragement] }
        : session
    ));
  });

  // Update elapsed time for active sessions
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSessions(prev => prev.map(session => {
        if (session.isActive) {
          const startTime = new Date(session.startTime);
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          return { ...session, elapsed };
        }
        return session;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendEncouragement = (sessionId: string, emoji: string, message: string) => {
    // TODO: Send encouragement via API
    console.log('Sending encouragement:', { sessionId, emoji, message });
    setEncouragementMessage('');
    setSelectedSession(null);
  };

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (elapsed: number, duration: number) => {
    return Math.min((elapsed / (duration * 60)) * 100, 100);
  };

  const encouragementOptions = [
    { emoji: '💪', message: 'You got this!' },
    { emoji: '🔥', message: 'On fire!' },
    { emoji: '⭐', message: 'Amazing focus!' },
    { emoji: '🎯', message: 'Stay focused!' },
    { emoji: '👏', message: 'Great work!' },
    { emoji: '🚀', message: 'Keep going!' },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Focus Sessions
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>{liveSessions.length} active</span>
          </div>
        </div>
      </FadeIn>

      {/* Live Sessions */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {liveSessions.map((session) => (
            <motion.div
              key={session.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {/* User Avatar */}
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                    {session.userAvatar ? (
                      <img 
                        src={session.userAvatar} 
                        alt={session.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {session.userName.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  
                  {/* Session Info */}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {session.userName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {session.sessionType} • {session.duration} min
                    </div>
                  </div>
                </div>
                
                {/* Timer */}
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                    {formatElapsedTime(session.elapsed)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(getProgressPercentage(session.elapsed, session.duration))}%
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-green-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage(session.elapsed, session.duration)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              
              {/* Encouragements */}
              {session.encouragements.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {session.encouragements.slice(-3).map((encouragement) => (
                      <motion.div
                        key={encouragement.id}
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="flex items-center space-x-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full text-xs"
                      >
                        <span>{encouragement.emoji}</span>
                        <span>{encouragement.fromUserName}</span>
                      </motion.div>
                    ))}
                    {session.encouragements.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                        +{session.encouragements.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Encourage Button */}
              {showEncouragement && session.userId !== currentUserId && (
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {encouragementOptions.slice(0, 3).map((option) => (
                      <Button
                        key={option.emoji}
                        onClick={() => sendEncouragement(session.id, option.emoji, option.message)}
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1"
                      >
                        {option.emoji}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => setSelectedSession(session)}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    Encourage
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {liveSessions.length === 0 && (
        <FadeIn>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No active focus sessions</p>
              <p className="text-xs mt-1">Start a session to see live updates from your connections</p>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Encouragement Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Encourage {selectedSession.userName}
              </h3>
              
              <div className="space-y-4">
                {/* Quick Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quick Encouragement
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {encouragementOptions.map((option) => (
                      <Button
                        key={option.emoji}
                        onClick={() => sendEncouragement(selectedSession.id, option.emoji, option.message)}
                        variant="outline"
                        className="flex items-center space-x-2 justify-start"
                      >
                        <span>{option.emoji}</span>
                        <span className="text-sm">{option.message}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Custom Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Message
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={encouragementMessage}
                      onChange={(e) => setEncouragementMessage(e.target.value)}
                      placeholder="Write a custom message..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      maxLength={100}
                    />
                    <Button
                      onClick={() => sendEncouragement(selectedSession.id, '💬', encouragementMessage)}
                      disabled={!encouragementMessage.trim()}
                      className="bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <Button
                  onClick={() => setSelectedSession(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveFocusSharing;