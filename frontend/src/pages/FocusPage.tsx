import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Components
import { 
  FocusTimer, 
  PomodoroTimer, 
  SessionTemplates, 
  FocusAnalytics, 
  DistractionLogger,
  type SessionTemplate 
} from '../components/features/focus';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

// Hooks and API
import { useFocusQueries } from '../hooks/queries/useFocusQueries';
import type { FocusSession } from '../types';

type ViewMode = 'timer' | 'pomodoro' | 'templates' | 'analytics' | 'distractions';

export default function FocusPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('timer');
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [sessionDistractions, setSessionDistractions] = useState<any[]>([]);

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

  // Find active session - only one should be active at a time
  useEffect(() => {
    // Filter for truly active sessions (not completed, not cancelled)
    const activeSessions = sessions.filter(session => 
      !session.completed_at && 
      session.started_at > 0 &&
      !session.cancellation_reason
    );
    
    // If multiple active sessions found, log warning and take the most recent one
    if (activeSessions.length > 1) {
      console.warn(`Found ${activeSessions.length} active sessions, taking the most recent one`);
    }
    
    // Sort by started_at descending and take the first (most recent)
    const active = activeSessions.sort((a, b) => b.started_at - a.started_at)[0] || null;
    setActiveSession(active);
  }, [sessions]);

  // Set default template
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      const classicTemplate = templates.find(t => t.template_key === 'classic_pomodoro') || templates[0];
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
      
      // Find and set the template that was used for this session
      const usedTemplate = templates.find(t => t.template_key === templateKey);
      if (usedTemplate) {
        setSelectedTemplate(usedTemplate);
      }
      
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
      toast.success('Session paused');
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
          actual_duration: Math.floor((Date.now() - activeSession.started_at) / 60000), // minutes
          productivity_rating: rating,
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
    setShowCancelDialog(true);
  };

  const confirmCancelSession = async () => {
    if (!activeSession) return;
    
    try {
      await cancelSessionMutation.mutateAsync({ 
        id: activeSession.id, 
        reason: 'User cancelled session' 
      });
      setActiveSession(null);
      setShowCancelDialog(false);
      toast.success('Session cancelled');
    } catch (error) {
      toast.error('Failed to cancel session');
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
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'timer'
                  ? 'bg-primary-600 text-white'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Timer
            </button>
            <button
              onClick={() => setViewMode('pomodoro')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'pomodoro'
                  ? 'bg-primary-600 text-white'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => setViewMode('templates')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'templates'
                  ? 'bg-primary-600 text-white'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'analytics'
                  ? 'bg-primary-600 text-white'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setViewMode('distractions')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'distractions'
                  ? 'bg-primary-600 text-white'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Distractions
            </button>
          </div>
        </div>
      </div>

      {/* Active Session Status */}
      {activeSession && (
        <div className="card p-4 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="font-medium text-foreground">
                  Focus Session Active
                </p>
                <p className="text-sm text-foreground-secondary">
                  Session: {activeSession.session_name || activeSession.session_type}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button onClick={handlePauseSession} className="btn btn-secondary">
                Pause
              </button>
              <button onClick={handleCancelSession} className="btn btn-secondary text-red-600 hover:text-red-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'timer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FocusTimer
              duration={selectedTemplate?.duration_minutes ? selectedTemplate.duration_minutes * 60 : 1500}
              onComplete={() => handleCompleteSession(5, 'Session completed')}
              autoStart={false}
              size="lg"
            />
          </div>
          <div>
            <SessionTemplates
              onSelectTemplate={setSelectedTemplate}
              selectedTemplate={selectedTemplate}
              onCreateCustom={() => setViewMode('templates')}
            />
          </div>
        </div>
      )}

      {viewMode === 'pomodoro' && (
        <div className="max-w-2xl mx-auto">
          <PomodoroTimer
            settings={{
              focusDuration: 25,
              shortBreakDuration: 5,
              longBreakDuration: 15,
              sessionsUntilLongBreak: 4,
              autoStartBreaks: false,
              autoStartFocus: false,
            }}
            onSessionComplete={(type, sessionCount) => {
              toast.success(`${type} session completed! Session ${sessionCount}`);
            }}
            onCycleComplete={(cycleCount) => {
              toast.success(`🎉 Cycle ${cycleCount} completed!`);
            }}
          />
        </div>
      )}

      {viewMode === 'templates' && (
        <SessionTemplates
          onSelectTemplate={setSelectedTemplate}
          selectedTemplate={selectedTemplate}
          onCreateCustom={() => {
            // TODO: Implement custom template creation
            toast.info('Custom template creation coming soon!');
          }}
        />
      )}

      {viewMode === 'analytics' && (
        <FocusAnalytics 
          sessions={sessions.map(session => ({
            id: session.id,
            date: new Date(session.started_at).toISOString(),
            duration: session.actual_duration || session.planned_duration,
            type: session.session_type === 'pomodoro' ? 'pomodoro' : 'focus',
            templateName: session.session_name || session.session_type,
            completed: !!session.completed_at,
            interruptions: sessionDistractions.filter(d => d.sessionId === session.id).length,
            productivity: session.productivity_rating || 3,
          }))}
        />
      )}

      {viewMode === 'distractions' && (
        <DistractionLogger
          sessionId={activeSession?.id || 'no-session'}
          isSessionActive={!!activeSession}
          onDistractionLogged={(distraction) => {
            setSessionDistractions(prev => [...prev, { ...distraction, sessionId: activeSession?.id }]);
            toast.info('Distraction logged');
          }}
          onDistractionAnalysis={(distractions) => {
            // TODO: Send distraction analysis to backend
            console.log('Distraction analysis:', distractions);
          }}
        />
      )}

      {/* Cancel Session Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={confirmCancelSession}
        title="Cancel Focus Session"
        message="Are you sure you want to cancel this focus session? This action cannot be undone."
        confirmText="Cancel Session"
        cancelText="Keep Session"
        variant="danger"
      />
    </div>
  );
}