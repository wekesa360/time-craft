import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Timer,
  Target,
  Coffee,
  Settings,
  TrendingUp
} from 'lucide-react';

// Components
import { FocusTimer } from '../components/features/focus/FocusTimer';
import { SessionTemplates } from '../components/features/focus/SessionTemplates';
import { FocusAnalytics } from '../components/features/focus/FocusAnalytics';

// Hooks and API
import { useFocusQueries } from '../hooks/queries/useFocusQueries';
import { FocusSession, SessionTemplate } from '../types';

type ViewMode = 'timer' | 'templates' | 'analytics';

export default function FocusPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('timer');
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null);

  // Queries
  const {
    useFocusTemplatesQuery,
    useFocusSessionsQuery,
    useStartFocusSessionMutation,
    useCompleteFocusSessionMutation,
    usePauseFocusSessionMutation,
    useResumeFocusSessionMutation,
    useCancelFocusSessionMutation
  } = useFocusQueries();

  const { data: templates = [], isLoading: templatesLoading } = useFocusTemplatesQuery();
  const { data: sessions = [], isLoading: sessionsLoading } = useFocusSessionsQuery();

  // Mutations
  const startSessionMutation = useStartFocusSessionMutation();
  const completeSessionMutation = useCompleteFocusSessionMutation();
  const pauseSessionMutation = usePauseFocusSessionMutation();
  const resumeSessionMutation = useResumeFocusSessionMutation();
  const cancelSessionMutation = useCancelFocusSessionMutation();

  // Find active session
  useEffect(() => {
    const active = sessions.find(session => 
      session.status === 'active' || session.status === 'paused'
    );
    setActiveSession(active || null);
  }, [sessions]);

  // Set default template
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      const classicTemplate = templates.find(t => t.key === 'classic_pomodoro') || templates[0];
      setSelectedTemplate(classicTemplate);
    }
  }, [templates, selectedTemplate]);

  // Handlers
  const handleStartSession = async (templateKey: string, taskId?: string) => {
    try {
      const session = await startSessionMutation.mutateAsync({
        templateKey,
        taskId
      });
      setActiveSession(session);
      toast.success('Focus session started!');
    } catch (error) {
      toast.error('Failed to start session');
    }
  };

  const handlePauseSession = async () => {
    if (!activeSession) return;
    
    try {
      const session = await pauseSessionMutation.mutateAsync(activeSession.id);
      setActiveSession(session);
      toast.info('Session paused');
    } catch (error) {
      toast.error('Failed to pause session');
    }
  };

  const handleResumeSession = async () => {
    if (!activeSession) return;
    
    try {
      const session = await resumeSessionMutation.mutateAsync(activeSession.id);
      setActiveSession(session);
      toast.success('Session resumed');
    } catch (error) {
      toast.error('Failed to resume session');
    }
  };

  const handleCompleteSession = async (rating: number, notes?: string) => {
    if (!activeSession) return;
    
    try {
      await completeSessionMutation.mutateAsync({
        id: activeSession.id,
        data: {
          actualEndTime: Date.now(),
          productivityRating: rating,
          notes
        }
      });
      setActiveSession(null);
      toast.success('🎉 Session completed!');
    } catch (error) {
      toast.error('Failed to complete session');
    }
  };

  const handleCancelSession = async () => {
    if (!activeSession) return;
    
    if (window.confirm('Are you sure you want to cancel this session?')) {
      try {
        await cancelSessionMutation.mutateAsync(activeSession.id);
        setActiveSession(null);
        toast.info('Session cancelled');
      } catch (error) {
        toast.error('Failed to cancel session');
      }
    }
  };

  if (templatesLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('navigation.focus')}
          </h1>
          <p className="text-foreground-secondary mt-1">
            Boost your productivity with focused work sessions
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-background-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('timer')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'timer' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="Timer"
            >
              <Timer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('templates')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'templates' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="Templates"
            >
              <Target className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'analytics' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="Analytics"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Session Status */}
      {activeSession && (
        <div className="card p-4 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                activeSession.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`} />
              <div>
                <p className="font-medium text-foreground">
                  {activeSession.status === 'active' ? 'Focus Session Active' : 'Session Paused'}
                </p>
                <p className="text-sm text-foreground-secondary">
                  Template: {templates.find(t => t.key === activeSession.templateKey)?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {activeSession.status === 'active' ? (
                <button onClick={handlePauseSession} className="btn-outline">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </button>
              ) : (
                <button onClick={handleResumeSession} className="btn-primary">
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </button>
              )}
              <button onClick={handleCancelSession} className="btn-outline text-red-600">
                <Square className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'timer' && (
        <FocusTimer
          activeSession={activeSession}
          selectedTemplate={selectedTemplate}
          templates={templates}
          onStartSession={handleStartSession}
          onCompleteSession={handleCompleteSession}
          onPauseSession={handlePauseSession}
          onResumeSession={handleResumeSession}
          onCancelSession={handleCancelSession}
        />
      )}

      {viewMode === 'templates' && (
        <SessionTemplates
          templates={templates}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={setSelectedTemplate}
          onStartSession={handleStartSession}
          activeSession={activeSession}
        />
      )}

      {viewMode === 'analytics' && (
        <FocusAnalytics />
      )}
    </div>
  );
}