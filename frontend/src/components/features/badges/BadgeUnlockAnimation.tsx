/**
 * Badge Unlock Animation Component
 * Celebration effects for badge unlocks
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { Button } from '../../ui';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
}

interface BadgeUnlockAnimationProps {
  badge: Badge | null;
  isVisible: boolean;
  onClose: () => void;
  onShare?: (badge: Badge) => void;
  className?: string;
}

const tierColors = {
  bronze: {
    bg: 'from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-800 dark:text-amber-200',
    glow: 'shadow-amber-500/50',
  },
  silver: {
    bg: 'from-gray-100 to-slate-100 dark:from-gray-900/20 dark:to-slate-900/20',
    border: 'border-gray-300 dark:border-gray-700',
    text: 'text-muted-foreground dark:text-muted-foreground',
    glow: 'shadow-gray-500/50',
  },
  gold: {
    bg: 'from-yellow-100 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-warning dark:text-warning-light',
    glow: 'shadow-yellow-500/50',
  },
  platinum: {
    bg: 'from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-info dark:text-info-light',
    glow: 'shadow-blue-500/50',
  },
  diamond: {
    bg: 'from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-800 dark:text-purple-200',
    glow: 'shadow-purple-500/50',
  },
};

const rarityEffects = {
  common: { particles: 10, duration: 2 },
  rare: { particles: 20, duration: 3 },
  epic: { particles: 30, duration: 4 },
  legendary: { particles: 50, duration: 5 },
};

const celebrationMessages = [
  "🎉 Achievement Unlocked!",
  "🌟 Congratulations!",
  "🏆 Well Done!",
  "✨ Amazing Work!",
  "🎊 Fantastic!",
  "🚀 Outstanding!",
];

const BadgeUnlockAnimation: React.FC<BadgeUnlockAnimationProps> = ({
  badge,
  isVisible,
  onClose,
  onShare,
  className,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  useEffect(() => {
    if (isVisible && badge) {
      setShowConfetti(true);
      setCelebrationMessage(celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]);
      
      // Generate particles based on rarity
      const effect = rarityEffects[badge.rarity];
      const newParticles = Array.from({ length: effect.particles }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
      }));
      setParticles(newParticles);

      // Auto-hide confetti after animation
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, effect.duration * 1000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, badge]);

  if (!badge || !isVisible) return null;

  const tierConfig = tierColors[badge.tier];
  const rarityConfig = rarityEffects[badge.rarity];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Confetti Particles */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  x: `${particle.x}vw`, 
                  y: `${particle.y}vh`, 
                  scale: 0,
                  rotate: 0,
                  opacity: 0 
                }}
                animate={{ 
                  y: '100vh',
                  scale: [0, 1, 0.8, 0],
                  rotate: [0, 180, 360],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{ 
                  duration: rarityConfig.duration,
                  delay: particle.delay,
                  ease: "easeOut"
                }}
                className={cn(
                  'absolute w-3 h-3 rounded-full',
                  badge.rarity === 'legendary' ? 'bg-gradient-to-r from-purple-400 to-pink-400' :
                  badge.rarity === 'epic' ? 'bg-gradient-to-r from-blue-400 to-purple-400' :
                  badge.rarity === 'rare' ? 'bg-gradient-to-r from-green-400 to-blue-400' :
                  'bg-gradient-to-r from-yellow-400 to-orange-400'
                )}
              />
            ))}
          </div>
        )}

        {/* Main Modal */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 20,
            delay: 0.2 
          }}
          className={cn(
            'bg-white dark:bg-muted rounded-2xl shadow-2xl max-w-md w-full overflow-hidden',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Celebration Message */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={cn(
              'text-center p-6 bg-gradient-to-br',
              tierConfig.bg,
              tierConfig.border,
              'border-b'
            )}
          >
            <motion.h2
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.7,
                type: "spring",
                stiffness: 300
              }}
              className={cn('text-2xl font-bold mb-2', tierConfig.text)}
            >
              {celebrationMessage}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className={cn('text-sm opacity-75', tierConfig.text)}
            >
              You've earned a new badge!
            </motion.p>
          </motion.div>

          {/* Badge Display */}
          <div className="p-8 text-center space-y-6">
            {/* Badge Icon with Glow Effect */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 1.0,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="relative mx-auto"
            >
              <motion.div
                animate={{ 
                  boxShadow: [
                    `0 0 20px ${tierConfig.glow}`,
                    `0 0 40px ${tierConfig.glow}`,
                    `0 0 20px ${tierConfig.glow}`
                  ]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={cn(
                  'w-24 h-24 rounded-full flex items-center justify-center text-4xl bg-gradient-to-br',
                  tierConfig.bg,
                  tierConfig.border,
                  'border-2'
                )}
              >
                {badge.icon}
              </motion.div>
              
              {/* Tier Indicator */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2 }}
                className={cn(
                  'absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold uppercase',
                  tierConfig.bg,
                  tierConfig.border,
                  tierConfig.text,
                  'border'
                )}
              >
                {badge.tier}
              </motion.div>
            </motion.div>

            {/* Badge Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="space-y-2"
            >
              <h3 className="text-xl font-bold text-foreground dark:text-white">
                {badge.name}
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground">
                {badge.description}
              </p>
              
              {/* Category and Rarity */}
              <div className="flex items-center justify-center space-x-4 text-sm">
                <span className={cn(
                  'px-2 py-1 rounded-full',
                  tierConfig.bg,
                  tierConfig.text,
                  'border',
                  tierConfig.border
                )}>
                  {badge.category}
                </span>
                <span className={cn(
                  'px-2 py-1 rounded-full font-medium',
                  badge.rarity === 'legendary' ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' :
                  badge.rarity === 'epic' ? 'bg-info-light text-info border-blue-200 dark:bg-info/20 dark:text-info-light dark:border-blue-800' :
                  badge.rarity === 'rare' ? 'bg-success-light text-success border-green-200 dark:bg-success/20 dark:text-success-light dark:border-green-800' :
                  'bg-muted text-muted-foreground border-gray-200 dark:bg-muted/20 dark:text-muted-foreground dark:border-gray-800',
                  'border'
                )}>
                  {badge.rarity}
                </span>
              </div>
            </motion.div>

            {/* Unlock Time */}
            {badge.unlockedAt && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-xs text-muted-foreground dark:text-muted-foreground"
              >
                Unlocked on {new Date(badge.unlockedAt).toLocaleDateString()}
              </motion.p>
            )}
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="p-6 bg-muted dark:bg-muted flex flex-col sm:flex-row gap-3"
          >
            {onShare && (
              <Button
                onClick={() => onShare(badge)}
                className="flex-1 bg-info hover:bg-info text-white"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share Achievement
              </Button>
            )}
            
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>

        {/* Background Glow Effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.3, scale: 2 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 2 }}
          className={cn(
            'absolute inset-0 rounded-full blur-3xl pointer-events-none',
            badge.rarity === 'legendary' ? 'bg-purple-500' :
            badge.rarity === 'epic' ? 'bg-info-light0' :
            badge.rarity === 'rare' ? 'bg-success-light0' :
            'bg-warning-light0'
          )}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default BadgeUnlockAnimation;