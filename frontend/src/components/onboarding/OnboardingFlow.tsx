/**
 * Onboarding Flow Component
 * Multi-step guided tour for new users
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAccessibilityContext } from '../accessibility/AccessibilityProvider';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Check, 
  ArrowRight,
  Lightbulb,
  Target,
  Zap,
  Heart,
  Calendar,
  Award,
  Users
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  component?: React.ComponentType;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showSkip?: boolean;
  required?: boolean;
}

interface OnboardingFlowProps {
  steps: OnboardingStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onStepComplete?: (stepId: string) => void;
  showProgress?: boolean;
  allowSkipping?: boolean;
  darkOverlay?: boolean;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  steps,
  isOpen,
  onComplete,
  onSkip,
  onStepComplete,
  showProgress = true,
  allowSkipping = true,
  darkOverlay = true,
}) => {
  const { t } = useTranslation();
  const { announce, trapFocus, saveFocus, restoreFocus } = useAccessibilityContext();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      saveFocus();
      announce(t('onboarding.started', 'Onboarding started'), 'assertive');
    } else {
      restoreFocus();
    }
  }, [isOpen, saveFocus, restoreFocus, announce, t]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (allowSkipping) {
            handleSkip();
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevious();
          break;
        case 'Enter':
          event.preventDefault();
          if (isLastStep) {
            handleComplete();
          } else {
            handleNext();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, allowSkipping]);

  const handleNext = () => {
    if (!currentStep) return;

    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep.id]));
    onStepComplete?.(currentStep.id);

    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
      announce(
        t('onboarding.stepChanged', 'Step {{current}} of {{total}}', {
          current: currentStepIndex + 2,
          total: steps.length
        })
      );
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      announce(
        t('onboarding.stepChanged', 'Step {{current}} of {{total}}', {
          current: currentStepIndex,
          total: steps.length
        })
      );
    }
  };

  const handleSkip = () => {
    announce(t('onboarding.skipped', 'Onboarding skipped'));
    onSkip();
  };

  const handleComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep.id]));
    announce(t('onboarding.completed', 'Onboarding completed'));
    onComplete();
  };

  const goToStep = (index: number) => {
    setCurrentStepIndex(index);
    announce(
      t('onboarding.stepChanged', 'Step {{current}} of {{total}}', {
        current: index + 1,
        total: steps.length
      })
    );
  };

  if (!isOpen || !currentStep) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        {darkOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={allowSkipping ? handleSkip : undefined}
          />
        )}

        {/* Onboarding Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-background rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 border border-border"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          aria-describedby="onboarding-description"
        >
          {/* Close Button */}
          {allowSkipping && (
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 text-foreground-secondary hover:text-foreground rounded-lg hover:bg-background-secondary transition-colors"
              aria-label={t('onboarding.close', 'Close onboarding')}
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Progress Bar */}
          {showProgress && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-foreground-secondary mb-2">
                <span>{t('onboarding.step', 'Step')} {currentStepIndex + 1} {t('onboarding.of', 'of')} {steps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-background-secondary rounded-full h-2">
                <motion.div
                  className="bg-primary-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              {/* Step Indicators */}
              <div className="flex justify-between mt-3">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => goToStep(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      index <= currentStepIndex
                        ? 'bg-primary-500 text-white'
                        : 'bg-background-secondary text-foreground-secondary hover:bg-background-tertiary'
                    }`}
                    aria-label={`${t('onboarding.goToStep', 'Go to step')} ${index + 1}: ${step.title}`}
                    disabled={index > currentStepIndex}
                  >
                    {completedSteps.has(step.id) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Icon */}
              {currentStep.icon && (
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <currentStep.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              )}

              {/* Title */}
              <h2 
                id="onboarding-title"
                className="text-2xl font-bold text-foreground text-center mb-4"
              >
                {currentStep.title}
              </h2>

              {/* Description */}
              <p 
                id="onboarding-description"
                className="text-foreground-secondary text-center mb-6 leading-relaxed"
              >
                {currentStep.description}
              </p>

              {/* Custom Component */}
              {currentStep.component && (
                <div className="mb-6">
                  <currentStep.component />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 text-foreground-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t('onboarding.previous', 'Previous step')}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t('onboarding.back', 'Back')}</span>
            </button>

            <div className="flex items-center space-x-2">
              {allowSkipping && !currentStep.required && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {t('onboarding.skipTour', 'Skip Tour')}
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
                aria-label={isLastStep ? t('onboarding.finish', 'Finish') : t('onboarding.next', 'Next step')}
              >
                <span>{isLastStep ? t('onboarding.finish', 'Finish') : t('onboarding.next', 'Next')}</span>
                {isLastStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Predefined onboarding steps for TimeCraft
export const defaultOnboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TimeCraft',
    description: 'Your personal productivity companion for managing tasks, health, and goals all in one place.',
    icon: Zap,
    showSkip: true,
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'Get an overview of your tasks, health metrics, and progress. Everything you need at a glance.',
    icon: Target,
  },
  {
    id: 'tasks',
    title: 'Task Management',
    description: 'Organize your tasks using the Eisenhower Matrix. Prioritize what matters most.',
    icon: Target,
  },
  {
    id: 'health',
    title: 'Health Tracking',
    description: 'Monitor your wellness journey with exercise, nutrition, and mood tracking.',
    icon: Heart,
  },
  {
    id: 'focus',
    title: 'Focus Sessions',
    description: 'Use Pomodoro timers and focus sessions to boost your productivity.',
    icon: Lightbulb,
  },
  {
    id: 'calendar',
    title: 'Smart Scheduling',
    description: 'AI-powered meeting scheduling and calendar management.',
    icon: Calendar,
  },
  {
    id: 'gamification',
    title: 'Achievements',
    description: 'Earn badges and compete with friends to stay motivated.',
    icon: Award,
  },
  {
    id: 'social',
    title: 'Social Features',
    description: 'Connect with friends, join challenges, and share your progress.',
    icon: Users,
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You\'re ready to start your productivity journey. Remember, you can always access help from the menu.',
    icon: Check,
    required: true,
  },
];

// Onboarding provider hook
export const useOnboarding = () => {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem('onboarding-completed');
    setHasCompletedOnboarding(completed === 'true');
  }, []);

  const startOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  const completeOnboarding = () => {
    setIsOnboardingOpen(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboarding-completed', 'true');
  };

  const skipOnboarding = () => {
    setIsOnboardingOpen(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboarding-completed', 'true');
    localStorage.setItem('onboarding-skipped', 'true');
  };

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding-completed');
    localStorage.removeItem('onboarding-skipped');
    setHasCompletedOnboarding(false);
  };

  return {
    isOnboardingOpen,
    hasCompletedOnboarding,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
};