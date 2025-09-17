/**
 * Stagger Animation Component
 * Animate children with staggered timing
 */

import React from 'react';
import { motion, MotionProps } from 'framer-motion';

interface StaggerProps extends Omit<MotionProps, 'initial' | 'animate' | 'exit'> {
  children: React.ReactNode;
  stagger?: number;
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';
  distance?: number;
  className?: string;
}

const Stagger: React.FC<StaggerProps> = ({
  children,
  stagger = 0.1,
  duration = 0.6,
  delay = 0,
  direction = 'up',
  distance = 20,
  className,
  ...motionProps
}) => {
  const getVariants = () => {
    const baseVariants = {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: stagger,
          delayChildren: delay,
        },
      },
    };

    const childVariants = {
      hidden: (() => {
        switch (direction) {
          case 'up':
            return { y: distance, opacity: 0 };
          case 'down':
            return { y: -distance, opacity: 0 };
          case 'left':
            return { x: distance, opacity: 0 };
          case 'right':
            return { x: -distance, opacity: 0 };
          case 'scale':
            return { scale: 0.8, opacity: 0 };
          case 'fade':
          default:
            return { opacity: 0 };
        }
      })(),
      visible: (() => {
        switch (direction) {
          case 'up':
          case 'down':
            return {
              y: 0,
              opacity: 1,
              transition: { duration, ease: [0.25, 0.46, 0.45, 0.94] },
            };
          case 'left':
          case 'right':
            return {
              x: 0,
              opacity: 1,
              transition: { duration, ease: [0.25, 0.46, 0.45, 0.94] },
            };
          case 'scale':
            return {
              scale: 1,
              opacity: 1,
              transition: { duration, ease: [0.25, 0.46, 0.45, 0.94] },
            };
          case 'fade':
          default:
            return {
              opacity: 1,
              transition: { duration, ease: [0.25, 0.46, 0.45, 0.94] },
            };
        }
      })(),
    };

    return { container: baseVariants, item: childVariants };
  };

  const variants = getVariants();

  return (
    <motion.div
      variants={variants.container}
      initial="hidden"
      animate="visible"
      className={className}
      {...motionProps}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={variants.item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default Stagger;