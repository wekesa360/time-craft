/**
 * Scale In Animation Component
 * Smooth scale-in animation with bounce effect
 */

import React from 'react';
import { motion, MotionProps } from 'framer-motion';

interface ScaleInProps extends Omit<MotionProps, 'initial' | 'animate' | 'exit'> {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  delay?: number;
  bounce?: boolean;
  className?: string;
}

const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  scale = 0.8,
  duration = 0.5,
  delay = 0,
  bounce = false,
  className,
  ...motionProps
}) => {
  const bounceTransition = {
    type: 'spring',
    damping: 15,
    stiffness: 300,
    delay,
  };

  const smoothTransition = {
    duration,
    delay,
    ease: [0.25, 0.46, 0.45, 0.94],
  };

  return (
    <motion.div
      initial={{ scale, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={bounce ? bounceTransition : smoothTransition}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default ScaleIn;