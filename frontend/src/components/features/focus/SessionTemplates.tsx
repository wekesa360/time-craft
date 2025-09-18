import React from 'react';
import type { SessionTemplate, FocusSession } from '../../../types';
import { 
  Play, 
  Clock, 
  Coffee, 
  Target, 
  Zap, 
  Brain,
  Timer,
  Repeat
} from 'lucide-react';

interface SessionTemplatesProps {
  templates: SessionTemplate[];
  selectedTemplate: SessionTemplate | null;
  onSelectTemplate: (template: SessionTemplate) => void;
  onStartSession: (templateKey: string) => void;
  activeSession: FocusSession | null;
}

const templateIcons = {
  classic_pomodoro: Timer,
  extended_pomodoro: Clock,
  deep_work: Brain,
  quick_sprint: Zap,
  flow_state: Target
};

const templateColors = {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const Icon = getTemplateIcon(template.key);
          const color = getTemplateColor(template.key);
          const isSelected = selectedTemplate?.key === template.key;
          const canStart = !activeSession;

          return (
            <div
              key={template.key}
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
                    {template.key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                  <span className="font-medium text-foreground">{template.focusDuration}m</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Coffee className="w-4 h-4 text-foreground-secondary" />
                    <span className="text-foreground-secondary">Short Break</span>
                  </div>
                  <span className="font-medium text-foreground">{template.shortBreakDuration}m</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Coffee className="w-4 h-4 text-foreground-secondary" />
                    <span className="text-foreground-secondary">Long Break</span>
                  </div>
                  <span className="font-medium text-foreground">{template.longBreakDuration}m</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Repeat className="w-4 h-4 text-foreground-secondary" />
                    <span className="text-foreground-secondary">Sessions Until Long Break</span>
                  </div>
                  <span className="font-medium text-foreground">{template.sessionsUntilLongBreak}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {canStart ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartSession(template.key);
                    }}
                    className={`btn-primary w-full ${
                      isSelected ? '' : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn-secondary w-full opacity-50 cursor-not-allowed"
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
                <th className="text-center py-2 text-foreground">Focus</th>
                <th className="text-center py-2 text-foreground">Short Break</th>
                <th className="text-center py-2 text-foreground">Long Break</th>
                <th className="text-center py-2 text-foreground">Cycle</th>
                <th className="text-left py-2 text-foreground">Best For</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => {
                const Icon = getTemplateIcon(template.key);
                const color = getTemplateColor(template.key);
                
                return (
                  <tr key={template.key} className="border-b border-border/50">
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 text-${color}-600`} />
                        <span className="font-medium text-foreground">{template.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 text-foreground">{template.focusDuration}m</td>
                    <td className="text-center py-3 text-foreground">{template.shortBreakDuration}m</td>
                    <td className="text-center py-3 text-foreground">{template.longBreakDuration}m</td>
                    <td className="text-center py-3 text-foreground">{template.sessionsUntilLongBreak}</td>
                    <td className="py-3 text-foreground-secondary">
                      {template.key === 'classic_pomodoro' && 'General productivity, time management'}
                      {template.key === 'extended_pomodoro' && 'Deep work, complex tasks'}
                      {template.key === 'deep_work' && 'Research, writing, coding'}
                      {template.key === 'quick_sprint' && 'Quick tasks, email, admin'}
                      {template.key === 'flow_state' && 'Creative work, problem solving'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          💡 Focus Session Tips
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>• Choose a quiet environment free from distractions</li>
          <li>• Turn off notifications on your devices</li>
          <li>• Have a clear goal for each focus session</li>
          <li>• Take breaks seriously - they help maintain focus</li>
          <li>• Experiment with different templates to find what works best</li>
          <li>• Track your productivity to identify patterns</li>
        </ul>
      </div>
    </div>
  );
};