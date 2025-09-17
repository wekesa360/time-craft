/**
 * Animation Provider
 * Global animation settings and controls
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { useAccessibilityContext } from '../../accessibility/AccessibilityProvider';

interface AnimationSettings {
  enabled: boolean;
  reducedMotion: boolean;
  duration: number;
  easing: string;
  stagger: number;
  pageTransitions: boolean;
  microInteractions: boolean;
  loadingAnimations: boolean;
}

interface AnimationContextType extends AnimationSettings {
  updateSettings: (settings: Partial<AnimationSettings>) => void;
  toggleAnimations: () => void;
  resetToDefaults: () => void;
}

const defaultSettings: AnimationSettings = {
  enabled: true,
  reducedMotion: false,
  duration: 0.3,
  easing: 'easeOut',
  stagger: 0.1,
  pageTransitions: true,
  microInteractions: true,
  loadingAnimations: true,
};

const AnimationContext = createContext<AnimationContextType | null>(null);

export const useAnimationContext = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimationContext must be used within AnimationProvider');
  }
  return context;
};

interface AnimationProviderProps {
  children: ReactNode;
  initialSettings?: Partial<AnimationSettings>;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({
  children,
  initialSettings = {},
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();
  const [settings, setSettings] = useState<AnimationSettings>({
    ...defaultSettings,
    ...initialSettings,
    reducedMotion: prefersReducedMotion,
  });

  // Update reduced motion preference when accessibility context changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      reducedMotion: prefersReducedMotion,
      enabled: !prefersReducedMotion && prev.enabled,
    }));
  }, [prefersReducedMotion]);

  const updateSettings = (newSettings: Partial<AnimationSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  const toggleAnimations = () => {
    setSettings(prev => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  const resetToDefaults = () => {
    setSettings({
      ...defaultSettings,
      reducedMotion: prefersReducedMotion,
    });
  };

  const contextValue: AnimationContextType = {
    ...settings,
    updateSettings,
    toggleAnimations,
    resetToDefaults,
  };

  // Framer Motion global configuration
  const motionConfig = {
    transition: {
      duration: settings.enabled ? settings.duration : 0,
      ease: settings.easing,
    },
    reducedMotion: settings.reducedMotion || !settings.enabled ? 'always' : 'never',
  };

  return (
    <AnimationContext.Provider value={contextValue}>
      <MotionConfig {...motionConfig}>
        {children}
      </MotionConfig>
    </AnimationContext.Provider>
  );
};

// Higher-order component for conditional animations
interface WithAnimationProps {
  children: ReactNode;
  condition?: boolean;
  fallback?: ReactNode;
}

export const WithAnimation: React.FC<WithAnimationProps> = ({
  children,
  condition = true,
  fallback,
}) => {
  const { enabled, reducedMotion } = useAnimationContext();
  const shouldAnimate = enabled && !reducedMotion && condition;

  if (!shouldAnimate && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Animation control hooks
export const useAnimationControls = () => {
  const context = useAnimationContext();
  
  return {
    ...context,
    shouldAnimate: context.enabled && !context.reducedMotion,
    getTransition: (override?: Partial<{ duration: number; ease: string; delay: number }>) => ({
      duration: override?.duration ?? context.duration,
      ease: override?.ease ?? context.easing,
      delay: override?.delay ?? 0,
    }),
    getStaggerDelay: (index: number) => index * context.stagger,
  };
};

// Performance monitoring for animations
export const useAnimationPerformance = () => {
  const [metrics, setMetrics] = useState({
    frameRate: 60,
    droppedFrames: 0,
    renderTime: 0,
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFrameRate = (currentTime: number) => {
      frameCount++;
      const elapsed = currentTime - lastTime;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        const dropped = Math.max(0, 60 - fps);
        
        setMetrics({
          frameRate: fps,
          droppedFrames: dropped,
          renderTime: elapsed / frameCount,
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFrameRate);
    };

    animationId = requestAnimationFrame(measureFrameRate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return metrics;
};

// Animation presets
export const animationPresets = {
  gentle: {
    duration: 0.5,
    easing: 'easeOut',
    stagger: 0.15,
  },
  snappy: {
    duration: 0.2,
    easing: 'easeInOut',
    stagger: 0.05,
  },
  smooth: {
    duration: 0.4,
    easing: 'easeInOut',
    stagger: 0.1,
  },
  playful: {
    duration: 0.6,
    easing: 'easeOut',
    stagger: 0.2,
  },
  minimal: {
    duration: 0.15,
    easing: 'linear',
    stagger: 0.03,
  },
};

// Common animation variants
export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 },
  },
  bounce: {
    initial: { opacity: 0, y: -50 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    },
    exit: { opacity: 0, y: 50 },
  },
  rotate: {
    initial: { opacity: 0, rotate: -10 },
    animate: { opacity: 1, rotate: 0 },
    exit: { opacity: 0, rotate: 10 },
  },
  blur: {
    initial: { opacity: 0, filter: 'blur(4px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(4px)' },
  },
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  },
};

// Page transition variants
export const pageTransitionVariants = {
  slide: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  slideUp: {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -100 },
  },
  slideDown: {
    initial: { opacity: 0, y: -100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 100 },
  },
  rotateY: {
    initial: { opacity: 0, rotateY: 90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: -90 },
  },
  flipX: {
    initial: { opacity: 0, rotateX: 90 },
    animate: { opacity: 1, rotateX: 0 },
    exit: { opacity: 0, rotateX: -90 },
  },
};

// Gesture variants for touch interactions
export const gestureVariants = {
  tap: {
    scale: 0.95,
  },
  hover: {
    scale: 1.05,
  },
  focus: {
    scale: 1.02,
    boxShadow: '0 0 0 2px rgb(59 130 246 / 0.5)',
  },
};