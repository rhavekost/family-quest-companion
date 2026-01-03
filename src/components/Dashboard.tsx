import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FamilyMemberCard } from "@/components/FamilyMemberCard";
import { MemberDetailSheet } from "@/components/MemberDetailSheet";
import { SettingsDialog } from "@/components/SettingsDialog";
import { TaskManager } from "@/components/TaskManager";
import { useFamilyStore } from "@/store/familyStore";
import { useFamilyData } from "@/hooks/useHabiticaData";
import { FamilyMemberWithData } from "@/types/habitica";
import { 
  RefreshCw, 
  Users, 
  Flame, 
  CheckCircle, 
  Coins,
  TrendingUp,
  Settings,
  Lock,
  LayoutGrid,
  Table2
} from "lucide-react";
import { cn } from "@/lib/utils";

type View = "dashboard" | "tasks";

export function Dashboard() {
  const { familyMembers, lock, isDemoMode } = useFamilyStore();
  const { familyData, isLoading, refetchAll } = useFamilyData(familyMembers);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberWithData | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentView, setCurrentView] = useState<View>("dashboard");

  const totalGold = familyData.reduce((sum, m) => sum + (m.userData?.stats.gp || 0), 0);
  const averageLevel = familyData.length > 0
    ? Math.round(familyData.reduce((sum, m) => sum + (m.userData?.stats.lvl || 0), 0) / familyData.filter((m) => m.userData).length) || 0
    : 0;
  const totalDailiesCompleted = familyData.reduce((sum, m) => sum + (m.tasks?.filter((t) => t.type === "daily" && t.isDue && t.completed).length || 0), 0);
  const totalDailiesDue = familyData.reduce((sum, m) => sum + (m.tasks?.filter((t) => t.type === "daily" && t.isDue && !t.completed).length || 0), 0);
  const membersWithLowHealth = familyData.filter((m) => m.userData && m.userData.stats.hp < m.userData.stats.maxHealth * 0.3);

  // Show Task Manager view
  if (currentView === "tasks") {
    return <TaskManager onBack={() => setCurrentView("dashboard")} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {isDemoMode && (
        <div className="mb-4 px-4 py-2 bg-accent/20 border border-accent/30 rounded-lg text-center">
          <span className="text-accent font-medium">🎮 Demo Mode</span>
          <span className="text-muted-foreground ml-2">— Sample data for preview. Click Lock to exit.</span>
        </div>
      )}
      
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold">Family Quest</h1>
          <p className="text-muted-foreground mt-1">{familyMembers.length} family members connected</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Task Manager Button */}
          <Button 
            variant="gold" 
            size="sm" 
            onClick={() => setCurrentView("tasks")} 
            className="gap-2"
          >
            <Table2 size={16} />
            Task Manager
          </Button>
          
          <Button variant="outline" size="sm" onClick={refetchAll} disabled={isLoading} className="gap-2">
            <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="gap-2">
            <Settings size={16} />
            Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={lock} className="gap-2 text-muted-foreground hover:text-foreground">
            <Lock size={16} />
            Lock
          </Button>
        </div>
      </motion.header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center"><Coins className="text-gold" size={20} /></div><div><p className="text-xs text-muted-foreground">Total Gold</p><p className="text-lg font-bold text-gold">{Math.floor(totalGold).toLocaleString()}</p></div></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><TrendingUp className="text-primary" size={20} /></div><div><p className="text-xs text-muted-foreground">Avg Level</p><p className="text-lg font-bold text-foreground">{averageLevel}</p></div></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-healer/20 flex items-center justify-center"><CheckCircle className="text-healer" size={20} /></div><div><p className="text-xs text-muted-foreground">Dailies Done</p><p className="text-lg font-bold text-healer">{totalDailiesCompleted}</p></div></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4 flex items-center gap-3"><div className={cn("w-10 h-10 rounded-full flex items-center justify-center", totalDailiesDue > 0 ? "bg-task-bad/20" : "bg-healer/20")}><Flame className={totalDailiesDue > 0 ? "text-task-bad" : "text-healer"} size={20} /></div><div><p className="text-xs text-muted-foreground">Dailies Due</p><p className={cn("text-lg font-bold", totalDailiesDue > 0 ? "text-task-bad" : "text-healer")}>{totalDailiesDue}</p></div></CardContent></Card>
      </motion.div>

      {membersWithLowHealth.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6">
          <Card className="border-health/50 bg-health/10"><CardContent className="p-4"><div className="flex items-center gap-2 text-health"><span className="text-xl">⚠️</span><span className="font-medium">Health Warning:</span><span>{membersWithLowHealth.map((m) => m.displayName).join(", ")} {membersWithLowHealth.length === 1 ? " is" : " are"} low on HP!</span></div></CardContent></Card>
        </motion.div>
      )}

      <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {familyData.map((member, index) => (
          <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <FamilyMemberCard member={member} onClick={() => setSelectedMember(member)} />
          </motion.div>
        ))}
      </motion.div>

      {familyMembers.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">No family members added</h2>
          <p className="text-muted-foreground mb-4">Add family members in settings to get started</p>
          <Button onClick={() => setShowSettings(true)}><Settings className="mr-2" size={18} />Open Settings</Button>
        </motion.div>
      )}

      <MemberDetailSheet member={selectedMember} open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)} onRefresh={refetchAll} />
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
