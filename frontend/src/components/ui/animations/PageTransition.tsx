/**
 * Enhanced Page Transition Component
 * Smooth page transitions for route changes with animation context
 */

import React from 'react';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAnimationControls, pageTransitionVariants } from './AnimationProvider';

interface PageTransitionProps extends Omit<MotionProps, 'initial' | 'animate' | 'exit'> {
  children: React.ReactNode;
  type?: keyof typeof pageTransitionVariants;
  duration?: number;
  className?: string;
  disabled?: boolean;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  type = 'fade',
  duration,
  className,
  disabled = false,
  onAnimationStart,
  onAnimationComplete,
  ...motionProps
}) => {
  const location = useLocation();
  const { shouldAnimate, getTransition, pageTransitions } = useAnimationControls();

  // Don't animate if disabled, animations are off, or page transitions are disabled
  if (disabled || !shouldAnimate || !pageTransitions) {
    return <div className={className}>{children}</div>;
  }

  const variants = pageTransitionVariants[type] || pageTransitionVariants.fade;
  const transition = getTransition({ duration });

  return (
    <AnimatePresence 
      mode="wait" 
      onExitComplete={() => {
        // Scroll to top after page transition
        window.scrollTo(0, 0);
      }}
    >
      <motion.div
        key={location.pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={transition}
        className={className}
        onAnimationStart={onAnimationStart}
        onAnimationComplete={onAnimationComplete}
        {...motionProps}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Route-based transition variants
const routeTransitions = {
  '/dashboard': 'slideLeft',
  '/tasks': 'slideUp',
  '/health': 'fade',
  '/calendar': 'scale',
  '/focus': 'slideDown',
  '/badges': 'bounce',
  '/social': 'slideRight',
  '/voice': 'blur',
  '/analytics': 'rotateY',
  '/admin': 'flipX',
  '/settings': 'slideDown',
} as const;

// Smart Page Transition that picks transition based on route
interface SmartPageTransitionProps extends Omit<PageTransitionProps, 'type'> {
  useRouteBasedTransitions?: boolean;
  fallbackType?: keyof typeof pageTransitionVariants;
}

export const SmartPageTransition: React.FC<SmartPageTransitionProps> = ({
  useRouteBasedTransitions = true,
  fallbackType = 'fade',
  ...props
}) => {
  const location = useLocation();
  
  let transitionType = fallbackType;
  
  if (useRouteBasedTransitions) {
    const routeTransition = routeTransitions[location.pathname as keyof typeof routeTransitions];
    if (routeTransition && routeTransition in pageTransitionVariants) {
      transitionType = routeTransition as keyof typeof pageTransitionVariants;
    }
  }

  return <PageTransition type={transitionType} {...props} />;
};

// Loading Page Transition
interface LoadingPageTransitionProps extends PageTransitionProps {
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;
  minLoadingTime?: number;
}

export const LoadingPageTransition: React.FC<LoadingPageTransitionProps> = ({
  isLoading = false,
  loadingComponent = <div>Loading...</div>,
  minLoadingTime = 300,
  children,
  ...props
}) => {
  const [showLoading, setShowLoading] = React.useState(isLoading);

  React.useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
    } else {
      // Ensure minimum loading time for better UX
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, minLoadingTime);

      return () => clearTimeout(timer);
    }
  }, [isLoading, minLoadingTime]);

  if (showLoading) {
    return (
      <PageTransition type="fade" duration={0.2} {...props}>
        {loadingComponent}
      </PageTransition>
    );
  }

  return <PageTransition {...props}>{children}</PageTransition>;
};

export default PageTransition;