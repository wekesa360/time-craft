import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  Share2,
  Trophy,
  Star,
  Award,
  Target,
  Heart,
  Flame,
  Zap,
  Crown,
} from "lucide-react";
import TabSwitcher from "../components/ui/TabSwitcher";
import type { TabItem } from "../components/ui/TabSwitcher";

// Components
import { BadgeGrid } from "../components/features/badges/BadgeGrid";
import { BadgeShare } from "../components/features/badges/BadgeShare";
import { BadgeLeaderboard } from "../components/features/badges/BadgeLeaderboard";

// Hooks and API
import { useBadgeQueries } from "../hooks/queries/useBadgeQueries";
import type { Badge } from "../types";

type ViewMode = "badges" | "leaderboard" | "achievements";

export default function BadgesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("badges");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Queries
  const { useBadgesQuery, useBadgeLeaderboardQuery, useShareBadgeMutation } =
    useBadgeQueries();

  const { data: badgeData, isLoading: badgesLoading } = useBadgesQuery();
  const { data: leaderboard = [], isLoading: leaderboardLoading } =
    useBadgeLeaderboardQuery();

  // Mutations
  const shareBadgeMutation = useShareBadgeMutation();

  // Extract data
  const badges = badgeData?.badges || [];
  const totalBadges = badgeData?.totalBadges || 0;
  const unlockedBadges = badgeData?.unlockedBadges || 0;

  // Handlers
  const handleShareBadge = (badge: Badge) => {
    setSelectedBadge(badge);
    setShareModalOpen(true);
  };

  const handleShare = async (
    badge: Badge,
    platform: string,
    message?: string
  ) => {
    try {
      await shareBadgeMutation.mutateAsync({
        badgeId: badge.id,
        platform,
        message,
      });
      toast.success(`Badge shared on ${platform}!`);
      setShareModalOpen(false);
    } catch (error) {
      toast.error("Failed to share badge");
    }
  };

  const isLoading = badgesLoading || leaderboardLoading;

  // Tab configuration
  const badgeTabs: TabItem[] = [
    { id: "badges", label: "My Badges" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "achievements", label: "Achievements" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Achievements & Badges
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your progress and celebrate milestones
        </p>
      </div>

      {/* Points Overview */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 md:p-8 text-primary-foreground">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-primary-foreground/80 mb-2">
              Total Points Earned
            </p>
            <p className="text-5xl md:text-6xl font-bold">
              {badges
                .filter((b) => b.isUnlocked)
                .reduce((sum, b) => sum + b.points, 0)}
            </p>
            <p className="text-primary-foreground/80 mt-2">
              Level {Math.floor(unlockedBadges / 5) + 1} - Wellness Champion
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-2">
                <Trophy className="w-10 h-10" />
              </div>
              <p className="text-sm">{unlockedBadges} Badges</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-2">
                <Star className="w-10 h-10" />
              </div>
              <p className="text-sm">
                {Math.round((unlockedBadges / totalBadges) * 100)}% Complete
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Navigation */}
      <TabSwitcher
        tabs={badgeTabs}
        activeTab={viewMode}
        onTabChange={(tabId) => setViewMode(tabId as ViewMode)}
      />

      {/* Content based on view mode */}
      {viewMode === "badges" && (
        <div className="space-y-6">
          {/* Recent Achievements */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Recent Achievements
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges
                .filter((b) => b.isUnlocked)
                .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
                .slice(0, 6)
                .map((badge) => (
                  <div
                    key={badge.id}
                    className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-border hover:border-primary transition-colors cursor-pointer"
                    onClick={() => handleShareBadge(badge)}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
                      <span className="text-2xl text-white">{badge.icon}</span>
                    </div>
                    <h3 className="font-bold text-foreground mb-1">
                      {badge.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {badge.description}
                    </p>
                    <p className="text-xs text-primary font-medium">
                      {badge.unlockedAt
                        ? new Date(badge.unlockedAt).toLocaleDateString()
                        : "Recently earned"}
                    </p>
                  </div>
                ))}

              {badges.filter((b) => b.isUnlocked).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Award className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No badges earned yet
                  </h3>
                  <p className="text-muted-foreground">
                    Complete tasks, log health activities, and maintain streaks
                    to earn your first badges
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* All Badges Grid */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">
              All Badges
            </h2>

            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                    badge.isUnlocked
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                  onClick={() => badge.isUnlocked && handleShareBadge(badge)}
                  title={badge.name}
                >
                  <span className="text-2xl">{badge.icon}</span>
                </div>
              ))}

              {/* Fill remaining slots if needed */}
              {Array.from({ length: Math.max(0, 24 - badges.length) }).map(
                (_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square rounded-xl bg-muted text-muted-foreground flex items-center justify-center"
                  >
                    <Award className="w-8 h-8" />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === "leaderboard" && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Badge Leaderboard
          </h2>
          <BadgeLeaderboard
            leaderboard={leaderboard}
            currentUserId="current-user"
            isLoading={leaderboardLoading}
          />
        </div>
      )}

      {viewMode === "achievements" && (
        <div className="space-y-6">
          {/* Active Streaks */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Active Streaks
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {badges
                .filter((b) => b.category === "streak" && b.isUnlocked)
                .slice(0, 4)
                .map((badge, i) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{badge.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {badge.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Current streak
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-foreground">
                        {badge.progress.current}
                      </p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </div>
                  </div>
                ))}

              {/* Default streaks if no streak badges */}
              {badges.filter((b) => b.category === "streak" && b.isUnlocked)
                .length === 0 && (
                <>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        Daily Task Completion
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Current streak
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-foreground">0</p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border">
                    <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-7 h-7 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        Health Logging
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Current streak
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-foreground">0</p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress Towards Next Badges */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Progress Towards Next Badges
            </h3>

            {badges.filter((b) => !b.isUnlocked && b.progress.percentage > 0)
              .length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Award className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No badges in progress</p>
                <p className="text-sm text-muted-foreground">
                  Complete more activities to start earning badges
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {badges
                  .filter((b) => !b.isUnlocked && b.progress.percentage > 0)
                  .sort((a, b) => b.progress.percentage - a.progress.percentage)
                  .slice(0, 5)
                  .map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center space-x-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border"
                    >
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-lg opacity-50">{badge.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-foreground">
                            {badge.name}
                          </h4>
                          <span className="text-sm text-muted-foreground">
                            {badge.progress.current}/{badge.progress.target}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-1">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${badge.progress.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {badge.progress.percentage.toFixed(0)}% complete •{" "}
                          {badge.progress.target - badge.progress.current} more
                          to unlock
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Badge Share Modal */}
      <BadgeShare
        badge={selectedBadge}
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setSelectedBadge(null);
        }}
        onShare={handleShare}
      />
      </div>
    </div>
  );
}
