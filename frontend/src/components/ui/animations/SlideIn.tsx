/**
 * Slide In Animation Component
 * Smooth slide-in animation from various directions
 */

import React from 'react';
import { motion, MotionProps } from 'framer-motion';

interface SlideInProps extends Omit<MotionProps, 'initial' | 'animate' | 'exit'> {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  className?: string;
}

const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  distance = 50,
  duration = 0.8,
  delay = 0,
  stagger = 0,
  className,
  ...motionProps
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { y: distance };
      case 'down':
        return { y: -distance };
      case 'left':
        return { x: distance };
      case 'right':
        return { x: -distance };
      default:
        return { y: distance };
    }
  };

  const getAnimatePosition = () => {
    switch (direction) {
      case 'up':
      case 'down':
        return { y: 0 };
      case 'left':
      case 'right':
        return { x: 0 };
      default:
        return { y: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={getAnimatePosition()}
      transition={{
        duration,
        delay: delay + stagger,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default SlideIn;