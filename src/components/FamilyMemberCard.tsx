import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ClassIcon } from "@/components/ClassIcon";
import { GoldDisplay } from "@/components/GoldDisplay";
import { LevelBadge } from "@/components/LevelBadge";
import { StreakBadge } from "@/components/StreakBadge";
import { FamilyMemberWithData } from "@/types/habitica";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FamilyMemberCardProps {
  member: FamilyMemberWithData;
  onClick?: () => void;
}

export function FamilyMemberCard({ member, onClick }: FamilyMemberCardProps) {
  const { userData, tasks, isLoading, error } = member;
  
  // Calculate dailies due today
  const dailiesDue = tasks?.filter(
    (t) => t.type === 'daily' && t.isDue && !t.completed
  ).length || 0;
  
  const dailiesCompleted = tasks?.filter(
    (t) => t.type === 'daily' && t.isDue && t.completed
  ).length || 0;
  
  const totalStreak = tasks
    ?.filter((t) => t.type === 'daily')
    .reduce((sum, t) => sum + (t.streak || 0), 0) || 0;

  const isAllCaughtUp = dailiesDue === 0 && dailiesCompleted > 0;
  const isLowHealth = userData && userData.stats.hp < userData.stats.maxHealth * 0.3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          "glass-card cursor-pointer transition-all duration-300 overflow-hidden",
          "hover:border-primary/50 hover:shadow-[0_0_30px_rgba(97,51,180,0.2)]",
          isLowHealth && "border-health/50"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: member.color + '30', color: member.color }}
              >
                {member.avatarEmoji || member.displayName[0]}
              </div>
              
              <div>
                <h3 className="font-display font-semibold text-foreground">
                  {member.displayName}
                </h3>
                {userData && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <ClassIcon className={userData.stats.class} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {userData.profile.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {userData && (
              <LevelBadge
                level={userData.stats.lvl}
                exp={userData.stats.exp}
                toNextLevel={userData.stats.toNextLevel}
                size="sm"
              />
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={20} />
              <span>Loading...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-8 text-destructive">
              <AlertTriangle className="mr-2" size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Stats */}
          {userData && !isLoading && !error && (
            <>
              {/* HP Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-health font-medium">HP</span>
                  <span className="text-muted-foreground">
                    {Math.round(userData.stats.hp)}/{userData.stats.maxHealth}
                  </span>
                </div>
                <ProgressBar
                  value={userData.stats.hp}
                  max={userData.stats.maxHealth}
                  variant="health"
                  size="sm"
                />
              </div>

              {/* XP Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-exp font-medium">XP</span>
                  <span className="text-muted-foreground">
                    {Math.round(userData.stats.exp)}/{userData.stats.toNextLevel}
                  </span>
                </div>
                <ProgressBar
                  value={userData.stats.exp}
                  max={userData.stats.toNextLevel}
                  variant="exp"
                  size="sm"
                />
              </div>

              {/* Footer Stats */}
              <div className="flex items-center justify-between">
                <GoldDisplay amount={userData.stats.gp} size="sm" />
                
                <div className="flex items-center gap-2">
                  {totalStreak > 0 && <StreakBadge count={totalStreak} size="sm" />}
                  
                  {isAllCaughtUp ? (
                    <div className="flex items-center gap-1 text-healer text-xs font-medium">
                      <CheckCircle size={14} />
                      <span>All done!</span>
                    </div>
                  ) : dailiesDue > 0 ? (
                    <div className="flex items-center gap-1 text-task-bad text-xs font-medium">
                      <AlertTriangle size={14} />
                      <span>{dailiesDue} due</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
