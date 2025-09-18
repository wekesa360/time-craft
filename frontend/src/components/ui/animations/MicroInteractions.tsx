/**
 * Micro Interactions Component
 * Subtle animations and interactions for better UX
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';
import { useAccessibilityContext } from '../../accessibility/AccessibilityProvider';

// Hover Scale Animation
interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
  disabled?: boolean;
}

export const HoverScale: React.FC<HoverScaleProps> = ({
  children,
  scale = 1.05,
  className,
  disabled = false,
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();

  if (prefersReducedMotion || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: scale * 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
};

// Bounce Animation
interface BounceProps {
  children: React.ReactNode;
  trigger?: boolean;
  delay?: number;
  className?: string;
}

export const Bounce: React.FC<BounceProps> = ({
  children,
  trigger = false,
  delay = 0,
  className,
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();
  const controls = useAnimation();

  useEffect(() => {
    if (trigger && !prefersReducedMotion) {
      controls.start({
        y: [0, -20, 0],
        transition: {
          duration: 0.6,
          delay,
          ease: "easeOut",
        },
      });
    }
  }, [trigger, controls, delay, prefersReducedMotion]);

  return (
    <motion.div
      className={className}
      animate={controls}
      initial={{ y: 0 }}
    >
      {children}
    </motion.div>
  );
};

// Shake Animation (for errors)
interface ShakeProps {
  children: React.ReactNode;
  trigger?: boolean;
  className?: string;
}

export const Shake: React.FC<ShakeProps> = ({
  children,
  trigger = false,
  className,
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();
  const controls = useAnimation();

  useEffect(() => {
    if (trigger && !prefersReducedMotion) {
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: {
          duration: 0.5,
          ease: "easeOut",
        },
      });
    }
  }, [trigger, controls, prefersReducedMotion]);

  return (
    <motion.div
      className={className}
      animate={controls}
      initial={{ x: 0 }}
    >
      {children}
    </motion.div>
  );
};

// Pulse Animation
interface PulseProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  intensity?: number;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  active = true,
  className,
  intensity = 1.1,
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();

  if (prefersReducedMotion || !active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, intensity, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
};

// Count Up Animation
interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 1.5,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const { prefersReducedMotion } = useAccessibilityContext();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      setDisplayValue(value * progress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration, prefersReducedMotion]);

  return (
    <span className={className}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
};

// Typewriter Animation
interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 50,
  delay = 0,
  className,
  onComplete,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const { prefersReducedMotion } = useAccessibilityContext();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayText(text);
      onComplete?.();
      return;
    }

    const timeout = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      } else {
        onComplete?.();
      }
    }, currentIndex === 0 ? delay : speed);

    return () => clearTimeout(timeout);
  }, [currentIndex, text, speed, delay, onComplete, prefersReducedMotion]);

  return (
    <span className={className}>
      {displayText}
      {!prefersReducedMotion && currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          |
        </motion.span>
      )}
    </span>
  );
};

// Sliding Number Animation
interface SlidingNumberProps {
  value: number;
  className?: string;
  duration?: number;
}

export const SlidingNumber: React.FC<SlidingNumberProps> = ({
  value,
  className,
  duration = 0.5,
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();

  if (prefersReducedMotion) {
    return <span className={className}>{value}</span>;
  }

  return (
    <motion.span
      key={value}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ duration, ease: "easeOut" }}
      className={className}
    >
      {value}
    </motion.span>
  );
};

// Progress Bar Animation
interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  color?: string;
  height?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  showPercentage = false,
  color = 'bg-primary-500',
  height = 'h-2',
  animated = true,
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`relative w-full ${className}`}>
      <div className={`w-full bg-background-secondary rounded-full ${height}`}>
        <motion.div
          className={`${color} ${height} rounded-full relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            duration: prefersReducedMotion ? 0 : 1,
            ease: "easeOut",
          }}
        >
          {animated && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      </div>
      {showPercentage && (
        <div className="absolute right-0 top-0 -mt-6 text-xs text-foreground-secondary">
          <CountUp value={clampedProgress} suffix="%" />
        </div>
      )}
    </div>
  );
};

// Loading Dots Animation
interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  className,
  color = 'bg-primary-500',
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();
  
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const dotClass = `${sizeClasses[size]} ${color} rounded-full`;

  if (prefersReducedMotion) {
    return (
      <div className={`flex space-x-1 ${className}`}>
        <div className={dotClass} />
        <div className={dotClass} />
        <div className={dotClass} />
      </div>
    );
  }

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={dotClass}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Card Flip Animation
interface CardFlipProps {
  children: [React.ReactNode, React.ReactNode];
  isFlipped?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CardFlip: React.FC<CardFlipProps> = ({
  children,
  isFlipped = false,
  className,
  onClick,
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();

  if (prefersReducedMotion) {
    return (
      <div className={className} onClick={onClick}>
        {isFlipped ? children[1] : children[0]}
      </div>
    );
  }

  return (
    <motion.div
      className={`relative cursor-pointer ${className}`}
      style={{ perspective: 1000 }}
      onClick={onClick}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full h-full relative"
      >
        <div
          className="absolute inset-0 w-full h-full"
          style={{ backfaceVisibility: "hidden" }}
        >
          {children[0]}
        </div>
        <div
          className="absolute inset-0 w-full h-full"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {children[1]}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Scroll Reveal Animation
interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  delay?: number;
  className?: string;
  threshold?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  className,
  threshold = 0.1,
}) => {
  const { prefersReducedMotion } = useAccessibilityContext();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    margin: '0px 0px -100px 0px',
    amount: threshold,
  });

  const variants = {
    hidden: {
      opacity: 0,
      ...(direction === 'up' && { y: 50 }),
      ...(direction === 'down' && { y: -50 }),
      ...(direction === 'left' && { x: 50 }),
      ...(direction === 'right' && { x: -50 }),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        delay: prefersReducedMotion ? 0 : delay,
        ease: "easeOut" as any,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Button Ripple Effect
interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  rippleColor?: string;
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  onClick,
  className,
  disabled = false,
  rippleColor = 'rgba(255, 255, 255, 0.5)',
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const { prefersReducedMotion } = useAccessibilityContext();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!prefersReducedMotion && !disabled) {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      const newRipple = {
        id: Date.now(),
        x,
        y,
      };

      setRipples(prev => [...prev, newRipple]);

      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }

    onClick?.(event);
  };

  return (
    <button
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: '100px',
              height: '100px',
              backgroundColor: rippleColor,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </button>
  );
};