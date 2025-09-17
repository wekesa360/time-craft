/**
 * AI Task Suggestions Component
 * Provides AI-powered task categorization and priority suggestions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { useTranslation } from 'react-i18next';

interface TaskSuggestion {
  id: string;
  type: 'priority' | 'category' | 'urgency' | 'importance' | 'context' | 'duration';
  title: string;
  description: string;
  confidence: number;
  suggestion: {
    priority?: 1 | 2 | 3 | 4;
    urgency?: 1 | 2 | 3 | 4 | 5;
    importance?: 1 | 2 | 3 | 4 | 5;
    contextType?: 'work' | 'personal' | 'health' | 'learning' | 'social';
    estimatedDuration?: number;
    tags?: string[];
  };
  reasoning: string;
}

interface AITaskSuggestionsProps {
  taskTitle: string;
  taskDescription?: string;
  currentValues?: {
    priority?: number;
    urgency?: number;
    importance?: number;
    contextType?: string;
    estimatedDuration?: number;
    tags?: string[];
  };
  onApplySuggestion: (suggestion: TaskSuggestion['suggestion']) => void;
  onDismiss: () => void;
  className?: string;
}

// Mock AI analysis function (in real app, this would call the backend)
const analyzeTask = async (title: string, description?: string): Promise<TaskSuggestion[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const suggestions: TaskSuggestion[] = [];

  // Analyze title and description for keywords
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Priority suggestions based on keywords
  if (text.includes('urgent') || text.includes('asap') || text.includes('immediately')) {
    suggestions.push({
      id: 'priority-urgent',
      type: 'priority',
      title: 'High Priority Detected',
      description: 'This task appears to be urgent based on the language used',
      confidence: 0.9,
      suggestion: { priority: 4, urgency: 5 },
      reasoning: 'Keywords like "urgent" or "ASAP" indicate high priority',
    });
  }

  // Context type suggestions
  if (text.includes('meeting') || text.includes('call') || text.includes('presentation')) {
    suggestions.push({
      id: 'context-work',
      type: 'context',
      title: 'Work Context Suggested',
      description: 'This appears to be a work-related task',
      confidence: 0.85,
      suggestion: { contextType: 'work' },
      reasoning: 'Contains work-related keywords like "meeting" or "presentation"',
    });
  }

  if (text.includes('exercise') || text.includes('workout') || text.includes('doctor') || text.includes('health')) {
    suggestions.push({
      id: 'context-health',
      type: 'context',
      title: 'Health Context Suggested',
      description: 'This appears to be health-related',
      confidence: 0.8,
      suggestion: { contextType: 'health' },
      reasoning: 'Contains health-related keywords',
    });
  }

  if (text.includes('learn') || text.includes('study') || text.includes('course') || text.includes('tutorial')) {
    suggestions.push({
      id: 'context-learning',
      type: 'context',
      title: 'Learning Context Suggested',
      description: 'This appears to be a learning task',
      confidence: 0.8,
      suggestion: { contextType: 'learning' },
      reasoning: 'Contains learning-related keywords',
    });
  }

  // Duration suggestions based on task type
  if (text.includes('quick') || text.includes('brief') || text.includes('short')) {
    suggestions.push({
      id: 'duration-short',
      type: 'duration',
      title: 'Short Duration Suggested',
      description: 'This task appears to be quick to complete',
      confidence: 0.7,
      suggestion: { estimatedDuration: 15 },
      reasoning: 'Language suggests this is a quick task',
    });
  }

  if (text.includes('meeting') && text.includes('hour')) {
    suggestions.push({
      id: 'duration-meeting',
      type: 'duration',
      title: 'Meeting Duration Detected',
      description: 'Standard meeting duration suggested',
      confidence: 0.8,
      suggestion: { estimatedDuration: 60 },
      reasoning: 'Meetings typically last 30-60 minutes',
    });
  }

  // Eisenhower Matrix suggestions
  if (text.includes('deadline') || text.includes('due')) {
    suggestions.push({
      id: 'matrix-urgent-important',
      type: 'urgency',
      title: 'Urgent & Important (Do First)',
      description: 'This task has a deadline and should be prioritized',
      confidence: 0.85,
      suggestion: { urgency: 5, importance: 4 },
      reasoning: 'Tasks with deadlines are typically urgent and important',
    });
  }

  // Tag suggestions
  const suggestedTags: string[] = [];
  if (text.includes('project')) suggestedTags.push('project');
  if (text.includes('client')) suggestedTags.push('client');
  if (text.includes('personal')) suggestedTags.push('personal');
  if (text.includes('team')) suggestedTags.push('team');
  if (text.includes('research')) suggestedTags.push('research');

  if (suggestedTags.length > 0) {
    suggestions.push({
      id: 'tags-suggested',
      type: 'category',
      title: 'Tags Suggested',
      description: `Suggested tags: ${suggestedTags.join(', ')}`,
      confidence: 0.6,
      suggestion: { tags: suggestedTags },
      reasoning: 'Based on keywords found in the task description',
    });
  }

  return suggestions;
};

const AITaskSuggestions: React.FC<AITaskSuggestionsProps> = ({
  taskTitle,
  taskDescription,
  currentValues,
  onApplySuggestion,
  onDismiss,
  className,
}) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (taskTitle.trim().length > 3) {
      setLoading(true);
      analyzeTask(taskTitle, taskDescription)
        .then(setSuggestions)
        .finally(() => setLoading(false));
    } else {
      setSuggestions([]);
    }
  }, [taskTitle, taskDescription]);

  const handleApplySuggestion = (suggestion: TaskSuggestion) => {
    onApplySuggestion(suggestion.suggestion);
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getSuggestionIcon = (type: TaskSuggestion['type']) => {
    switch (type) {
      case 'priority':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'context':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case 'duration':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'urgency':
      case 'importance':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
    }
  };

  if (!taskTitle.trim() || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
            AI Suggestions
          </h3>
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {!loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {suggestions.map((suggestion) => {
              const isApplied = appliedSuggestions.has(suggestion.id);
              
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'flex items-start space-x-3 p-3 rounded-lg border transition-all',
                    isApplied
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  )}
                >
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                    isApplied
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                      : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                  )}>
                    {isApplied ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      getSuggestionIcon(suggestion.type)
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {suggestion.title}
                      </h4>
                      <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        getConfidenceColor(suggestion.confidence),
                        'bg-current bg-opacity-10'
                      )}>
                        {getConfidenceLabel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                      {suggestion.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      {suggestion.reasoning}
                    </p>
                  </div>
                  
                  {!isApplied && (
                    <button
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="flex-shrink-0 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      Apply
                    </button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Analyzing task...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITaskSuggestions;