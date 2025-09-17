/**
 * Hover Animation Component
 * Interactive hover effects with smooth transitions
 */

import React from 'react';
import { motion, MotionProps } from 'framer-motion';

interface HoverProps extends Omit<MotionProps, 'whileHover' | 'whileTap'> {
  children: React.ReactNode;
  scale?: number;
  lift?: number;
  rotate?: number;
  brightness?: number;
  tapScale?: number;
  disabled?: boolean;
  className?: string;
}

const Hover: React.FC<HoverProps> = ({
  children,
  scale = 1.05,
  lift = 0,
  rotate = 0,
  brightness = 1,
  tapScale = 0.95,
  disabled = false,
  className,
  ...motionProps
}) => {
  const hoverEffects: any = {};
  const tapEffects: any = {};

  if (scale !== 1) hoverEffects.scale = scale;
  if (lift !== 0) hoverEffects.y = -lift;
  if (rotate !== 0) hoverEffects.rotate = rotate;
  if (brightness !== 1) hoverEffects.filter = `brightness(${brightness})`;

  if (tapScale !== 1) tapEffects.scale = tapScale;

  return (
    <motion.div
      whileHover={disabled ? {} : hoverEffects}
      whileTap={disabled ? {} : tapEffects}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default Hover;