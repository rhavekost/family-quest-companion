import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ClassIcon } from "@/components/ClassIcon";
import { GoldDisplay } from "@/components/GoldDisplay";
import { GemsDisplay } from "@/components/GemsDisplay";
import { LevelBadge } from "@/components/LevelBadge";
import { StreakBadge } from "@/components/StreakBadge";
import { FamilyMemberWithData, HabiticaTask } from "@/types/habitica";
import { scoreTask } from "@/lib/habiticaApi";
import { 
  Check, 
  Plus, 
  Minus, 
  Flame, 
  Calendar,
  Target,
  Gift,
  Loader2,
  Heart,
  Zap,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface MemberDetailSheetProps {
  member: FamilyMemberWithData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function MemberDetailSheet({ 
  member, 
  open, 
  onOpenChange,
  onRefresh 
}: MemberDetailSheetProps) {
  const [scoringTask, setScoringTask] = useState<string | null>(null);

  if (!member) return null;

  const { userData, tasks } = member;

  const habits = tasks?.filter(t => t.type === 'habit') || [];
  const dailies = tasks?.filter(t => t.type === 'daily') || [];
  const todos = tasks?.filter(t => t.type === 'todo' && !t.completed) || [];
  const rewards = tasks?.filter(t => t.type === 'reward') || [];

  const handleScoreTask = async (taskId: string, direction: 'up' | 'down') => {
    setScoringTask(taskId);
    try {
      await scoreTask(
        member.habiticaUserId,
        member.habiticaApiToken,
        taskId,
        direction
      );
      toast({
        title: direction === 'up' ? "Task completed!" : "Task scored down",
        description: "Stats updated successfully",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Failed to score task",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setScoringTask(null);
    }
  };

  const getTaskColor = (value: number) => {
    if (value < -10) return 'text-task-worst';
    if (value < 0) return 'text-task-bad';
    if (value < 5) return 'text-task-neutral';
    if (value < 10) return 'text-task-good';
    return 'text-task-best';
  };

  const getTaskBgColor = (value: number) => {
    if (value < -10) return 'bg-task-worst/10 border-task-worst/30';
    if (value < 0) return 'bg-task-bad/10 border-task-bad/30';
    if (value < 5) return 'bg-task-neutral/10 border-task-neutral/30';
    if (value < 10) return 'bg-task-good/10 border-task-good/30';
    return 'bg-task-best/10 border-task-best/30';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{ backgroundColor: member.color + '30', color: member.color }}
            >
              {member.avatarEmoji || member.displayName[0]}
            </div>
            <div className="flex-1">
              <SheetTitle className="font-display text-xl">
                {member.displayName}
              </SheetTitle>
              {userData && (
                <div className="flex items-center gap-2 mt-1">
                  <ClassIcon className={userData.stats.class} size="sm" showLabel />
                </div>
              )}
            </div>
            {userData && (
              <LevelBadge
                level={userData.stats.lvl}
                exp={userData.stats.exp}
                toNextLevel={userData.stats.toNextLevel}
                size="md"
              />
            )}
          </div>
        </SheetHeader>

        {userData && (
          <>
            {/* Stats Panel */}
            <Card className="glass-card mb-6">
              <CardContent className="p-4 space-y-3">
                {/* HP */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <Heart className="text-health" size={16} />
                      <span className="text-sm font-medium text-health">Health</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(userData.stats.hp)}/{userData.stats.maxHealth}
                    </span>
                  </div>
                  <ProgressBar
                    value={userData.stats.hp}
                    max={userData.stats.maxHealth}
                    variant="health"
                  />
                </div>

                {/* XP */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <Star className="text-exp" size={16} />
                      <span className="text-sm font-medium text-exp">Experience</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(userData.stats.exp)}/{userData.stats.toNextLevel}
                    </span>
                  </div>
                  <ProgressBar
                    value={userData.stats.exp}
                    max={userData.stats.toNextLevel}
                    variant="exp"
                  />
                </div>

                {/* MP */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <Zap className="text-mana" size={16} />
                      <span className="text-sm font-medium text-mana">Mana</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(userData.stats.mp)}/{userData.stats.maxMP}
                    </span>
                  </div>
                  <ProgressBar
                    value={userData.stats.mp}
                    max={userData.stats.maxMP}
                    variant="mana"
                  />
                </div>

                {/* Gold & Gems */}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <GoldDisplay amount={userData.stats.gp} size="md" />
                  <GemsDisplay amount={userData.balance} size="md" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{userData.stats.str}</div>
                    <div className="text-xs text-muted-foreground">STR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{userData.stats.con}</div>
                    <div className="text-xs text-muted-foreground">CON</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{userData.stats.int}</div>
                    <div className="text-xs text-muted-foreground">INT</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{userData.stats.per}</div>
                    <div className="text-xs text-muted-foreground">PER</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks Tabs */}
            <Tabs defaultValue="dailies" className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-secondary">
                <TabsTrigger value="habits" className="gap-1">
                  <Flame size={14} />
                  <span className="hidden sm:inline">Habits</span>
                </TabsTrigger>
                <TabsTrigger value="dailies" className="gap-1">
                  <Calendar size={14} />
                  <span className="hidden sm:inline">Dailies</span>
                </TabsTrigger>
                <TabsTrigger value="todos" className="gap-1">
                  <Target size={14} />
                  <span className="hidden sm:inline">To-Dos</span>
                </TabsTrigger>
                <TabsTrigger value="rewards" className="gap-1">
                  <Gift size={14} />
                  <span className="hidden sm:inline">Rewards</span>
                </TabsTrigger>
              </TabsList>

              {/* Habits */}
              <TabsContent value="habits" className="mt-4 space-y-2">
                {habits.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No habits</p>
                ) : (
                  habits.map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        getTaskBgColor(task.value)
                      )}
                    >
                      <div className="flex gap-1">
                        {task.up && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full bg-healer/20 text-healer hover:bg-healer/30"
                            onClick={() => handleScoreTask(task.id, 'up')}
                            disabled={scoringTask === task.id}
                          >
                            {scoringTask === task.id ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <Plus size={14} />
                            )}
                          </Button>
                        )}
                        {task.down && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full bg-health/20 text-health hover:bg-health/30"
                            onClick={() => handleScoreTask(task.id, 'down')}
                            disabled={scoringTask === task.id}
                          >
                            <Minus size={14} />
                          </Button>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={cn("font-medium", getTaskColor(task.value))}>
                          {task.text}
                        </p>
                        {task.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        +{task.counterUp || 0} / -{task.counterDown || 0}
                      </div>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              {/* Dailies */}
              <TabsContent value="dailies" className="mt-4 space-y-2">
                {dailies.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No dailies</p>
                ) : (
                  dailies.map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        task.completed 
                          ? "bg-muted/30 border-border opacity-60" 
                          : task.isDue
                          ? getTaskBgColor(task.value)
                          : "bg-muted/20 border-border/50"
                      )}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "h-8 w-8 rounded-full",
                          task.completed
                            ? "bg-healer/30 text-healer"
                            : task.isDue
                            ? "bg-secondary hover:bg-healer/20 hover:text-healer"
                            : "bg-muted text-muted-foreground"
                        )}
                        onClick={() => !task.completed && handleScoreTask(task.id, 'up')}
                        disabled={task.completed || scoringTask === task.id || !task.isDue}
                      >
                        {scoringTask === task.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Check size={14} />
                        )}
                      </Button>
                      <div className="flex-1">
                        <p className={cn(
                          "font-medium",
                          task.completed 
                            ? "text-muted-foreground line-through" 
                            : task.isDue 
                            ? getTaskColor(task.value)
                            : "text-muted-foreground"
                        )}>
                          {task.text}
                        </p>
                        {task.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.notes}
                          </p>
                        )}
                      </div>
                      {task.streak && task.streak > 0 && (
                        <StreakBadge count={task.streak} size="sm" />
                      )}
                    </motion.div>
                  ))
                )}
              </TabsContent>

              {/* To-Dos */}
              <TabsContent value="todos" className="mt-4 space-y-2">
                {todos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No to-dos</p>
                ) : (
                  todos.map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        getTaskBgColor(task.value)
                      )}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full bg-secondary hover:bg-healer/20 hover:text-healer"
                        onClick={() => handleScoreTask(task.id, 'up')}
                        disabled={scoringTask === task.id}
                      >
                        {scoringTask === task.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Check size={14} />
                        )}
                      </Button>
                      <div className="flex-1">
                        <p className={cn("font-medium", getTaskColor(task.value))}>
                          {task.text}
                        </p>
                        {task.date && (
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(task.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              {/* Rewards */}
              <TabsContent value="rewards" className="mt-4 space-y-2">
                {rewards.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No rewards</p>
                ) : (
                  rewards.map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-gold/10 border-gold/30"
                    >
                      <Button
                        size="sm"
                        variant="gold"
                        className="gap-1"
                        onClick={() => handleScoreTask(task.id, 'down')}
                        disabled={
                          scoringTask === task.id || 
                          (userData?.stats.gp || 0) < task.value
                        }
                      >
                        {scoringTask === task.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <>
                            <Gift size={14} />
                            Buy
                          </>
                        )}
                      </Button>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{task.text}</p>
                      </div>
                      <GoldDisplay amount={task.value} size="sm" />
                    </motion.div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
