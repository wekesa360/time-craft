import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { TrendingUp, Target, Clock } from 'lucide-react';

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
import { Button } from '../components/ui/Button';
import TabSwitcher, { type TabItem } from '../components/ui/TabSwitcher';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Tab configuration
  const focusTabs: TabItem[] = [
    { id: 'timer', label: 'Timer' },
    { id: 'pomodoro', label: 'Pomodoro' },
    { id: 'templates', label: 'Templates' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'distractions', label: 'Distractions' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Focus Timer</h1>
        <p className="text-muted-foreground mt-1">Deep work sessions with Pomodoro technique</p>
      </div>

      {/* View Navigation */}
      <TabSwitcher
        tabs={focusTabs}
        activeTab={viewMode}
        onTabChange={(tabId) => setViewMode(tabId as ViewMode)}
      />

      {/* Active Session Status */}
      {activeSession && (
        <div className="bg-card rounded-2xl p-6 border border-border border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              <div>
                <p className="font-semibold text-foreground">
                  Focus Session Active
                </p>
                <p className="text-sm text-muted-foreground">
                  Session: {activeSession.session_name || activeSession.session_type}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={handlePauseSession} 
                variant="outline"
                size="sm"
              >
                Pause
              </Button>
              <Button 
                onClick={handleCancelSession} 
                variant="outline"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'timer' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Timer */}
          <div className="lg:col-span-2 bg-card rounded-2xl p-8 md:p-12 border border-border">
            <div className="max-w-md mx-auto">
              <FocusTimer
                duration={selectedTemplate?.duration_minutes ? selectedTemplate.duration_minutes * 60 : 1500}
                onComplete={() => handleCompleteSession(5, 'Session completed')}
                autoStart={false}
                size="lg"
              />
            </div>
          </div>

          {/* Stats & Templates */}
          <div className="space-y-6">
            {/* Today's Focus */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">Today's Focus</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sessions</span>
                  <span className="text-2xl font-bold text-foreground">
                    {sessions.filter(s => s.completed_at && new Date(s.started_at).toDateString() === new Date().toDateString()).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Time</span>
                  <span className="text-2xl font-bold text-foreground">
                    {Math.floor(sessions
                      .filter(s => s.completed_at && new Date(s.started_at).toDateString() === new Date().toDateString())
                      .reduce((acc, s) => acc + (s.actual_duration || 0), 0) / 60)}h {sessions
                      .filter(s => s.completed_at && new Date(s.started_at).toDateString() === new Date().toDateString())
                      .reduce((acc, s) => acc + (s.actual_duration || 0), 0) % 60}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Goal Progress</span>
                  <span className="text-2xl font-bold text-primary">75%</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <TrendingUp className="w-4 h-4" />
                  <span>+30% from yesterday</span>
                </div>
              </div>
            </div>

            {/* Session Templates */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">Quick Start</h2>

              <div className="space-y-2">
                {templates.slice(0, 3).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      handleStartSession(template.template_key);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border border-border hover:border-primary transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{template.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{template.duration_minutes}m</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'pomodoro' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pomodoro Timer */}
          <div className="lg:col-span-2 bg-card rounded-2xl p-8 md:p-12 border border-border">
            <div className="max-w-md mx-auto">
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
          </div>

          {/* Pomodoro Stats */}
          <div className="space-y-6">
            {/* Today's Pomodoros */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">Today's Pomodoros</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-2xl font-bold text-foreground">
                    {sessions.filter(s => 
                      s.completed_at && 
                      s.session_type === 'pomodoro' && 
                      new Date(s.started_at).toDateString() === new Date().toDateString()
                    ).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Focus Time</span>
                  <span className="text-2xl font-bold text-foreground">
                    {Math.floor(sessions
                      .filter(s => 
                        s.completed_at && 
                        s.session_type === 'pomodoro' && 
                        new Date(s.started_at).toDateString() === new Date().toDateString()
                      )
                      .reduce((acc, s) => acc + (s.actual_duration || 0), 0) / 60)}h {sessions
                      .filter(s => 
                        s.completed_at && 
                        s.session_type === 'pomodoro' && 
                        new Date(s.started_at).toDateString() === new Date().toDateString()
                      )
                      .reduce((acc, s) => acc + (s.actual_duration || 0), 0) % 60}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <span className="text-2xl font-bold text-primary">4</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <TrendingUp className="w-4 h-4" />
                  <span>Great focus today!</span>
                </div>
              </div>
            </div>

            {/* Pomodoro Technique Info */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">Technique</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-foreground">25 min focus session</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-foreground">5 min short break</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-foreground">15 min long break</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'templates' && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Focus Templates</h2>
            <Button
              onClick={() => {
                toast.success('Custom template creation coming soon!');
              }}
              variant="outline"
            >
              Create Custom
            </Button>
          </div>
          
          <SessionTemplates
            onSelectTemplate={setSelectedTemplate}
            selectedTemplate={selectedTemplate}
            onCreateCustom={() => {
              toast.success('Custom template creation coming soon!');
            }}
          />
        </div>
      )}

      {viewMode === 'analytics' && (
        <div className="space-y-6">
          {/* Weekly Focus Analytics */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">Weekly Focus Analytics</h2>

            <div className="grid md:grid-cols-7 gap-3">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                // Calculate hours for each day from sessions
                const dayStart = new Date();
                dayStart.setDate(dayStart.getDate() - dayStart.getDay() + i);
                dayStart.setHours(0, 0, 0, 0);
                
                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23, 59, 59, 999);
                
                const dayHours = sessions
                  .filter(s => {
                    const sessionDate = new Date(s.started_at);
                    return sessionDate >= dayStart && sessionDate <= dayEnd && s.completed_at;
                  })
                  .reduce((acc, s) => acc + (s.actual_duration || 0), 0) / 60;

                const maxHeight = 4;
                const heightPercent = Math.min((dayHours / maxHeight) * 100, 100);

                return (
                  <div key={day} className="flex flex-col items-center">
                    <div className="w-full h-32 bg-muted rounded-lg relative overflow-hidden mb-2">
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{day}</span>
                    <span className="text-xs text-foreground font-bold">{dayHours.toFixed(1)}h</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border">
                <Clock className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Session</p>
                  <p className="text-xl font-bold text-foreground">
                    {sessions.length > 0 
                      ? Math.round(sessions.reduce((acc, s) => acc + (s.actual_duration || s.planned_duration), 0) / sessions.length)
                      : 0} min
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border">
                <Target className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-xl font-bold text-foreground">{sessions.filter(s => s.completed_at).length}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border">
                <TrendingUp className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Total</p>
                  <p className="text-xl font-bold text-foreground">
                    {(sessions
                      .filter(s => s.completed_at)
                      .reduce((acc, s) => acc + (s.actual_duration || 0), 0) / 60).toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Original Analytics Component */}
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
        </div>
      )}

      {viewMode === 'distractions' && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-6">Distraction Tracking</h2>
          
          <DistractionLogger
            sessionId={activeSession?.id || 'no-session'}
            isSessionActive={!!activeSession}
            onDistractionLogged={(distraction) => {
              setSessionDistractions(prev => [...prev, { ...distraction, sessionId: activeSession?.id }]);
              toast.success('Distraction logged');
            }}
            onDistractionAnalysis={(distractions) => {
              console.log('Distraction analysis:', distractions);
            }}
          />
        </div>
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