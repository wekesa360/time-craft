import React from 'react';
import type { Challenge } from '../../../types';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  Clock, 
  TrendingUp,
  Award,
  Play,
  CheckCircle,
  Lock
} from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin?: (challengeId: string) => void;
  onLeave?: (challengeId: string) => void;
  onViewDetails?: (challenge: Challenge) => void;
  currentUserId?: string;
  isParticipating?: boolean;
}

const challengeTypeIcons = {
  exercise_streak: '🏃‍♂️',
  task_completion: '✅',
  focus_time: '🎯',
  health_logging: '💪'
};

const challengeTypeLabels = {
  exercise_streak: 'Exercise Streak',
  task_completion: 'Task Completion',
  focus_time: 'Focus Time',
  health_logging: 'Health Logging'
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onJoin,
  onLeave,
  onViewDetails,
  currentUserId,
  isParticipating = false
}) => {
  const isActive = challenge.isActive && new Date(challenge.endDate) > new Date();
  const isUpcoming = new Date(challenge.startDate) > new Date();
  const isCompleted = new Date(challenge.endDate) < new Date();
  
  const daysRemaining = Math.ceil((challenge.endDate - Date.now()) / (1000 * 60 * 60 * 24));
  const daysUntilStart = Math.ceil((challenge.startDate - Date.now()) / (1000 * 60 * 60 * 24));
  
  const userParticipant = challenge.participants.find(p => p.userId === currentUserId);
  const userProgress = userParticipant?.progress || 0;
  const progressPercentage = (userProgress / challenge.targetValue) * 100;

  const getStatusColor = () => {
    if (isCompleted) return 'text-muted-foreground';
    if (isUpcoming) return 'text-info';
    if (isActive) return 'text-success';
    return 'text-muted-foreground';
  };

  const getStatusBadge = () => {
    if (isCompleted) return { text: 'Completed', color: 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground' };
    if (isUpcoming) return { text: 'Upcoming', color: 'bg-info-light text-info dark:bg-info dark:text-info-light' };
    if (isActive) return { text: 'Active', color: 'bg-success-light text-success dark:bg-success dark:text-success-light' };
    return { text: 'Inactive', color: 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground' };
  };

  const statusBadge = getStatusBadge();
  const topParticipants = challenge.leaderboard.slice(0, 3);

  return (
    <div className={`
      card p-6 transition-all duration-200 hover:shadow-lg cursor-pointer
      ${isParticipating ? 'border-2 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/20' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">
            {challengeTypeIcons[challenge.type]}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">{challenge.title}</h3>
            <p className="text-sm text-foreground-secondary">
              {challengeTypeLabels[challenge.type]}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
            {statusBadge.text}
          </span>
          {challenge.isPublic ? (
            <span title="Public challenge">
              <Users className="w-4 h-4 text-foreground-secondary" />
            </span>
          ) : (
            <span title="Private challenge">
              <Lock className="w-4 h-4 text-foreground-secondary" />
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-foreground-secondary mb-4 line-clamp-2">
        {challenge.description}
      </p>

      {/* Challenge Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <Target className="w-4 h-4 text-foreground-secondary" />
          <span className="text-foreground-secondary">Goal:</span>
          <span className="font-medium text-foreground">{challenge.targetValue}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <Users className="w-4 h-4 text-foreground-secondary" />
          <span className="text-foreground-secondary">Participants:</span>
          <span className="font-medium text-foreground">{challenge.participants.length}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="w-4 h-4 text-foreground-secondary" />
          <span className="text-foreground-secondary">Duration:</span>
          <span className="font-medium text-foreground">
            {Math.ceil((challenge.endDate - challenge.startDate) / (1000 * 60 * 60 * 24))} days
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <Clock className={`w-4 h-4 ${getStatusColor()}`} />
          <span className="text-foreground-secondary">
            {isUpcoming ? 'Starts in:' : isActive ? 'Ends in:' : 'Ended:'}
          </span>
          <span className={`font-medium ${getStatusColor()}`}>
            {isUpcoming ? `${daysUntilStart} days` : 
             isActive ? `${daysRemaining} days` : 
             'Completed'}
          </span>
        </div>
      </div>

      {/* User Progress (if participating) */}
      {isParticipating && userParticipant && (
        <div className="mb-4 p-3 bg-background-secondary rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Your Progress</span>
            <span className="text-sm text-foreground-secondary">
              {userProgress}/{challenge.targetValue}
            </span>
          </div>
          <div className="w-full bg-background-tertiary rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, progressPercentage)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-xs">
            <span className="text-foreground-secondary">
              {progressPercentage.toFixed(0)}% complete
            </span>
            {userParticipant.isActive && (
              <span className="text-success font-medium">Active</span>
            )}
          </div>
        </div>
      )}

      {/* Top Participants */}
      {topParticipants.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
            <Trophy className="w-4 h-4 mr-1 text-warning" />
            Top Participants
          </h4>
          <div className="space-y-1">
            {topParticipants.map((participant, index) => (
              <div key={participant.userId} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                    index === 0 ? 'bg-warning-light text-warning dark:bg-warning dark:text-warning-light' :
                    index === 1 ? 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-foreground">
                    {participant.firstName} {participant.lastName}
                  </span>
                  {participant.userId === currentUserId && (
                    <span className="text-xs text-primary-600">(You)</span>
                  )}
                </div>
                <span className="font-medium text-foreground">{participant.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={() => onViewDetails?.(challenge)}
          className="btn-ghost text-sm"
        >
          View Details
        </button>
        
        <div className="flex items-center space-x-2">
          {isParticipating ? (
            <>
              {isActive && (
                <span className="flex items-center text-sm text-success">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Participating
                </span>
              )}
              {onLeave && (
                <button
                  onClick={() => onLeave(challenge.id)}
                  className="btn-outline text-error border-red-300 hover:bg-error-light dark:hover:bg-error/20 text-sm"
                >
                  Leave Challenge
                </button>
              )}
            </>
          ) : (
            <>
              {isActive && onJoin && (
                <button
                  onClick={() => onJoin(challenge.id)}
                  className="btn-primary text-sm"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Join Challenge
                </button>
              )}
              {isUpcoming && (
                <span className="text-sm text-info">
                  Starts {new Date(challenge.startDate).toLocaleDateString()}
                </span>
              )}
              {isCompleted && (
                <span className="text-sm text-muted-foreground">
                  Challenge Ended
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};