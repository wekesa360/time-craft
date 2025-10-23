import React from 'react';
import type { SessionTemplate, FocusSession } from '../../../types';
import {
  Clock,
  Coffee,
  Target,
  Zap,
  Brain,
  Timer
} from 'lucide-react';

interface SessionTemplatesProps {
  templates: SessionTemplate[];
  selectedTemplate: SessionTemplate | null;
  onSelectTemplate: (template: SessionTemplate) => void;
  onStartSession: (templateKey: string) => void;
  activeSession: FocusSession | null;
}

const templateIcons = {
  pomodoro_25: Timer,
  deep_work_90: Brain,
  meditation_10: Coffee,
  exercise_30: Zap,
  // Legacy support
  classic_pomodoro: Timer,
  extended_pomodoro: Clock,
  deep_work: Brain,
  quick_sprint: Zap,
  flow_state: Target
};

const templateColors = {
  pomodoro_25: 'red',
  deep_work_90: 'purple',
  meditation_10: 'green',
  exercise_30: 'orange',
  // Legacy support
  classic_pomodoro: 'red',
  extended_pomodoro: 'blue',
  deep_work: 'purple',
  quick_sprint: 'orange',
  flow_state: 'green'
};

export const SessionTemplates: React.FC<SessionTemplatesProps> = ({
  templates,
  selectedTemplate,
  onSelectTemplate,
  onStartSession,
  activeSession
}) => {
  const getTemplateIcon = (templateKey: string) => {
    const IconComponent = templateIcons[templateKey as keyof typeof templateIcons] || Target;
    return IconComponent;
  };

  const getTemplateColor = (templateKey: string) => {
    return templateColors[templateKey as keyof typeof templateColors] || 'blue';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Focus Session Templates</h2>
        <p className="text-foreground-secondary">
          Choose a template that matches your work style and goals
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(templates || []).map((template) => {
          const Icon = getTemplateIcon(template.template_key);
          const color = getTemplateColor(template.template_key);
          const isSelected = selectedTemplate?.template_key === template.template_key;
          const canStart = !activeSession || activeSession.completed_at;

          return (
            <div
              key={template.template_key}
              className={`card p-6 cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? `border-2 border-${color}-500 bg-${color}-50 dark:bg-${color}-950/20` 
                  : 'border-2 border-transparent hover:border-border hover:shadow-md'
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              {/* Template Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 bg-${color}-100 dark:bg-${color}-950/30 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{template.name}</h3>
                  <p className="text-sm text-foreground-secondary">
                    {template.template_key?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-foreground-secondary mb-4">
                {template.description}
              </p>

              {/* Template Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-foreground-secondary" />
                    <span className="text-foreground-secondary">Focus Time</span>
                  </div>
                  <span className="font-medium text-foreground">{template.duration_minutes}m</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Coffee className="w-4 h-4 text-foreground-secondary" />
                    <span className="text-foreground-secondary">Short Break</span>
                  </div>
                  <span className="font-medium text-foreground">{template.break_duration_minutes}m</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-foreground-secondary" />
                    <span className="text-foreground-secondary">Session Type</span>
                  </div>
                  <span className="font-medium text-foreground">{template.session_type}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {canStart ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartSession(template.template_key);
                    }}
                    className={`btn btn-primary w-full ${
                      isSelected ? '' : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    Start Session
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn btn-secondary w-full opacity-50 cursor-not-allowed"
                  >
                    Session Active
                  </button>
                )}

                {isSelected && (
                  <div className="text-center">
                    <span className={`text-xs text-${color}-600 font-medium`}>
                      ✓ Selected Template
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Comparison */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Template Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-foreground">Template</th>
                <th className="text-center py-2 text-foreground">Duration</th>
                <th className="text-center py-2 text-foreground">Break</th>
                <th className="text-center py-2 text-foreground">Type</th>
                <th className="text-left py-2 text-foreground">Best For</th>
              </tr>
            </thead>
            <tbody>
              {(templates || []).map((template) => {
                const Icon = getTemplateIcon(template.template_key);
                const color = getTemplateColor(template.template_key);
                
                return (
                  <tr key={template.template_key} className="border-b border-border/50">
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 text-${color}-600`} />
                        <span className="font-medium text-foreground">{template.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 text-foreground">{template.duration_minutes}m</td>
                    <td className="text-center py-3 text-foreground">{template.break_duration_minutes}m</td>
                    <td className="text-center py-3 text-foreground">{template.session_type}</td>
                    <td className="py-3 text-foreground-secondary">
                      {template.template_key === 'pomodoro_25' && 'General productivity, time management'}
                      {template.template_key === 'deep_work_90' && 'Research, writing, complex tasks'}
                      {template.template_key === 'meditation_10' && 'Mindfulness, stress relief'}
                      {template.template_key === 'exercise_30' && 'Physical activity, breaks'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default SessionTemplates;