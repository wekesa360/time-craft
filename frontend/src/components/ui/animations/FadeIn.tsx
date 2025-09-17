/**
 * Fade In Animation Component
 * Smooth fade-in animation with customizable timing and direction
 */

import React from 'react';
import { motion, MotionProps } from 'framer-motion';

interface FadeInProps extends Omit<MotionProps, 'initial' | 'animate' | 'exit'> {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
  className?: string;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  direction = 'up',
  distance = 20,
  duration = 0.6,
  delay = 0,
  once = true,
  className,
  ...motionProps
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { y: distance, opacity: 0 };
      case 'down':
        return { y: -distance, opacity: 0 };
      case 'left':
        return { x: distance, opacity: 0 };
      case 'right':
        return { x: -distance, opacity: 0 };
      case 'none':
      default:
        return { opacity: 0 };
    }
  };

  const getAnimatePosition = () => {
    switch (direction) {
      case 'up':
      case 'down':
        return { y: 0, opacity: 1 };
      case 'left':
      case 'right':
        return { x: 0, opacity: 1 };
      case 'none':
      default:
        return { opacity: 1 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={getAnimatePosition()}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94], // Custom easing
      }}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;