import React, { useState } from 'react';
import type { Badge } from '../../../types';
import { BadgeCard } from './BadgeCard';
import { 
  Filter, 
  Search, 
  Trophy, 
  Heart, 
  Users, 
  Zap, 
  Star,
  Award,
  X
} from 'lucide-react';

interface BadgeGridProps {
  badges: Badge[];
  onShareBadge: (badge: Badge) => void;
  isLoading?: boolean;
}

const categoryFilters = [
  { value: '', label: 'All Categories', icon: Award },
  { value: 'productivity', label: 'Productivity', icon: Trophy },
  { value: 'health', label: 'Health', icon: Heart },
  { value: 'social', label: 'Social', icon: Users },
  { value: 'streak', label: 'Streaks', icon: Zap },
  { value: 'milestone', label: 'Milestones', icon: Star }
];

const tierFilters = [
  { value: '', label: 'All Tiers' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' }
];

const statusFilters = [
  { value: '', label: 'All Badges' },
  { value: 'unlocked', label: 'Unlocked' },
  { value: 'locked', label: 'Locked' },
  { value: 'in_progress', label: 'In Progress' }
];

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  badges,
  onShareBadge,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Filter badges based on search and filters
  const filteredBadges = badges.filter(badge => {
    // Search filter
    if (searchTerm && !badge.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !badge.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Category filter
    if (categoryFilter && badge.category !== categoryFilter) {
      return false;
    }

    // Tier filter
    if (tierFilter && badge.tier !== tierFilter) {
      return false;
    }

    // Status filter
    if (statusFilter) {
      if (statusFilter === 'unlocked' && !badge.isUnlocked) return false;
      if (statusFilter === 'locked' && badge.isUnlocked) return false;
      if (statusFilter === 'in_progress' && (badge.isUnlocked || badge.progress.percentage === 0)) return false;
    }

    return true;
  });

  // Sort badges: unlocked first, then by progress, then by tier
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    // Unlocked badges first
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;

    // If both unlocked or both locked, sort by progress
    if (a.isUnlocked === b.isUnlocked) {
      if (a.progress.percentage !== b.progress.percentage) {
        return b.progress.percentage - a.progress.percentage;
      }
      
      // Then by tier (platinum > gold > silver > bronze)
      const tierOrder = { platinum: 4, gold: 3, silver: 2, bronze: 1 };
      return tierOrder[b.tier] - tierOrder[a.tier];
    }

    return 0;
  });

  const unlockedCount = badges.filter(b => b.isUnlocked).length;
  const totalPoints = badges.filter(b => b.isUnlocked).reduce((sum, b) => sum + b.points, 0);
  const inProgressCount = badges.filter(b => !b.isUnlocked && b.progress.percentage > 0).length;

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setTierFilter('');
    setStatusFilter('');
  };

  const hasActiveFilters = searchTerm || categoryFilter || tierFilter || statusFilter;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-background-secondary rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-background-secondary rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">


      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-foreground-secondary">
          Showing {sortedBadges.length} of {badges.length} badges
        </p>
        {hasActiveFilters && (
          <p className="text-sm text-foreground-secondary">
            {sortedBadges.filter(b => b.isUnlocked).length} unlocked • {' '}
            {sortedBadges.filter(b => !b.isUnlocked && b.progress.percentage > 0).length} in progress
          </p>
        )}
      </div>

      {/* Badge Grid */}
      {sortedBadges.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No badges found</h3>
          <p className="text-foreground-secondary mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your filters to see more badges'
              : 'Complete activities to start earning badges'
            }
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-primary">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBadges.map((badge) => (
            <div key={badge.id} className="group">
              <BadgeCard
                badge={badge}
                onShare={onShareBadge}
                showProgress={true}
              />
            </div>
          ))}
        </div>
      )}

      {/* Category Legend */}
      <div className="card p-4">
        <h3 className="font-semibold text-foreground mb-3">Badge Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          {categoryFilters.slice(1).map((category) => {
            const Icon = category.icon;
            const count = badges.filter(b => b.category === category.value).length;
            const unlockedInCategory = badges.filter(b => b.category === category.value && b.isUnlocked).length;
            
            return (
              <div key={category.value} className="flex items-center space-x-2">
                <Icon className="w-4 h-4 text-foreground-secondary" />
                <div>
                  <p className="font-medium text-foreground">{category.label}</p>
                  <p className="text-xs text-foreground-secondary">
                    {unlockedInCategory}/{count} unlocked
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};