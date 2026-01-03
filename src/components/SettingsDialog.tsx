import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useFamilyStore } from "@/store/familyStore";
import { testConnection } from "@/lib/habiticaApi";
import { MEMBER_COLORS, MEMBER_AVATARS, FamilyMember } from "@/types/habitica";
import {
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  Users,
  AlertTriangle,
  Download,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { familyMembers, addMember, removeMember, resetAll } = useFamilyStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    name?: string;
    error?: string;
  } | null>(null);
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    displayName: "",
    habiticaUserId: "",
    habiticaApiToken: "",
    color: MEMBER_COLORS[familyMembers.length % MEMBER_COLORS.length].value,
    avatarEmoji: MEMBER_AVATARS[familyMembers.length % MEMBER_AVATARS.length],
  });

  const handleTestConnection = async () => {
    if (!newMember.habiticaUserId || !newMember.habiticaApiToken) {
      toast({
        title: "Missing credentials",
        description: "Please enter both User ID and API Token",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testConnection(
      newMember.habiticaUserId,
      newMember.habiticaApiToken
    );

    setTestResult(result);
    setIsTesting(false);
  };

  const handleAddMember = () => {
    if (!newMember.displayName || !testResult?.success) {
      toast({
        title: "Cannot add member",
        description: "Please fill in the display name and verify the connection",
        variant: "destructive",
      });
      return;
    }

    const member: FamilyMember = {
      id: crypto.randomUUID(),
      displayName: newMember.displayName,
      habiticaUserId: newMember.habiticaUserId!,
      habiticaApiToken: newMember.habiticaApiToken!,
      color: newMember.color!,
      avatarEmoji: newMember.avatarEmoji,
    };

    addMember(member);
    setShowAddForm(false);
    setNewMember({
      displayName: "",
      habiticaUserId: "",
      habiticaApiToken: "",
      color: MEMBER_COLORS[(familyMembers.length + 1) % MEMBER_COLORS.length].value,
      avatarEmoji: MEMBER_AVATARS[(familyMembers.length + 1) % MEMBER_AVATARS.length],
    });
    setTestResult(null);

    toast({
      title: "Member added!",
      description: `${member.displayName} has been added to the family.`,
    });
  };

  const handleRemoveMember = (member: FamilyMember) => {
    removeMember(member.id);
    toast({
      title: "Member removed",
      description: `${member.displayName} has been removed from the family.`,
    });
  };

  const handleExport = () => {
    const data = JSON.stringify(familyMembers, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "family-quest-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export complete",
      description: "Family data has been exported",
    });
  };

  const handleResetAll = () => {
    if (confirm("Are you sure? This will delete all family members and settings.")) {
      resetAll();
      onOpenChange(false);
      window.location.reload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Users className="text-primary" />
            Family Settings
          </DialogTitle>
        </DialogHeader>

        {/* Current Members */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Family Members</h3>
            <span className="text-sm text-muted-foreground">
              {familyMembers.length} members
            </span>
          </div>

          <div className="space-y-2">
            {familyMembers.map((member) => (
              <Card key={member.id} className="glass-card">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ backgroundColor: member.color + "30", color: member.color }}
                    >
                      {member.avatarEmoji || member.displayName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.displayName}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                        {member.habiticaUserId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveMember(member)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Member Form */}
          {showAddForm ? (
            <Card className="glass-card">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input
                      placeholder="e.g., Dad, Mom..."
                      value={newMember.displayName}
                      onChange={(e) =>
                        setNewMember({ ...newMember, displayName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Avatar</Label>
                    <div className="flex gap-1 flex-wrap">
                      {MEMBER_AVATARS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() =>
                            setNewMember({ ...newMember, avatarEmoji: emoji })
                          }
                          className={cn(
                            "w-8 h-8 rounded text-lg transition-all",
                            newMember.avatarEmoji === emoji
                              ? "bg-primary/30 ring-2 ring-primary"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {MEMBER_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() =>
                          setNewMember({ ...newMember, color: color.value })
                        }
                        className={cn(
                          "w-7 h-7 rounded-full transition-all",
                          newMember.color === color.value
                            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                            : "hover:scale-105"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Habitica User ID</Label>
                  <Input
                    placeholder="Enter User ID"
                    value={newMember.habiticaUserId}
                    onChange={(e) =>
                      setNewMember({ ...newMember, habiticaUserId: e.target.value })
                    }
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Habitica API Token</Label>
                  <Input
                    type="password"
                    placeholder="Enter API Token"
                    value={newMember.habiticaApiToken}
                    onChange={(e) =>
                      setNewMember({ ...newMember, habiticaApiToken: e.target.value })
                    }
                    className="font-mono text-sm"
                  />
                </div>

                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg",
                      testResult.success
                        ? "bg-healer/20 text-healer"
                        : "bg-destructive/20 text-destructive"
                    )}
                  >
                    {testResult.success ? (
                      <>
                        <Check size={18} />
                        <span>Connected! Character: {testResult.name}</span>
                      </>
                    ) : (
                      <>
                        <X size={18} />
                        <span>{testResult.error}</span>
                      </>
                    )}
                  </motion.div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex-1"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleAddMember}
                    disabled={!testResult?.success}
                    className="flex-1"
                  >
                    <Plus className="mr-2" size={16} />
                    Add Member
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAddForm(false);
                    setTestResult(null);
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="w-full"
            >
              <Plus className="mr-2" size={18} />
              Add Family Member
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border space-y-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="flex-1">
              <Download className="mr-2" size={16} />
              Export Data
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={handleResetAll}
            className="w-full text-destructive hover:bg-destructive/10"
          >
            <AlertTriangle className="mr-2" size={16} />
            Reset All Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
