import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFamilyStore } from "@/store/familyStore";
import { testConnection } from "@/lib/habiticaApi";
import { MEMBER_COLORS, MEMBER_AVATARS, FamilyMember } from "@/types/habitica";
import { DEMO_FAMILY_MEMBERS } from "@/data/demoData";
import { 
  Shield, 
  Users, 
  Plus, 
  Check, 
  X, 
  Loader2, 
  ChevronRight,
  KeyRound,
  Lock,
  Sparkles,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface SetupWizardProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'passphrase' | 'members' | 'complete';

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [members, setMembers] = useState<Partial<FamilyMember>[]>([]);
  const [currentMember, setCurrentMember] = useState<Partial<FamilyMember>>({
    displayName: '',
    habiticaUserId: '',
    habiticaApiToken: '',
    color: MEMBER_COLORS[0].value,
    avatarEmoji: MEMBER_AVATARS[0],
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    name?: string;
    error?: string;
  } | null>(null);

  const { setPassphrase: storePassphrase, addMember, completeSetup, enableDemoMode } = useFamilyStore();

  const handleDemoMode = () => {
    enableDemoMode(DEMO_FAMILY_MEMBERS);
    toast({
      title: "Demo Mode Activated!",
      description: "Exploring with 9 sample family members",
    });
    onComplete();
  };

  const handlePassphraseSubmit = () => {
    if (passphrase.length < 6) {
      toast({
        title: "Passphrase too short",
        description: "Please use at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    if (passphrase !== confirmPassphrase) {
      toast({
        title: "Passphrases don't match",
        description: "Please make sure both passphrases match",
        variant: "destructive",
      });
      return;
    }
    storePassphrase(passphrase);
    setStep('members');
  };

  const handleTestConnection = async () => {
    if (!currentMember.habiticaUserId || !currentMember.habiticaApiToken) {
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
      currentMember.habiticaUserId,
      currentMember.habiticaApiToken
    );

    setTestResult(result);
    setIsTesting(false);
  };

  const handleAddMember = () => {
    if (!currentMember.displayName || !testResult?.success) {
      toast({
        title: "Cannot add member",
        description: "Please fill in the display name and verify the connection",
        variant: "destructive",
      });
      return;
    }

    const newMember: FamilyMember = {
      id: crypto.randomUUID(),
      displayName: currentMember.displayName,
      habiticaUserId: currentMember.habiticaUserId!,
      habiticaApiToken: currentMember.habiticaApiToken!,
      color: currentMember.color!,
      avatarEmoji: currentMember.avatarEmoji,
    };

    addMember(newMember);
    setMembers([...members, newMember]);

    // Reset form
    setCurrentMember({
      displayName: '',
      habiticaUserId: '',
      habiticaApiToken: '',
      color: MEMBER_COLORS[(members.length + 1) % MEMBER_COLORS.length].value,
      avatarEmoji: MEMBER_AVATARS[(members.length + 1) % MEMBER_AVATARS.length],
    });
    setTestResult(null);

    toast({
      title: "Member added!",
      description: `${newMember.displayName} has been added to the family.`,
    });
  };

  const handleComplete = () => {
    if (members.length === 0) {
      toast({
        title: "No members added",
        description: "Please add at least one family member",
        variant: "destructive",
      });
      return;
    }
    completeSetup();
    setStep('complete');
    setTimeout(onComplete, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-lg w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary"
            >
              <Sparkles className="w-12 h-12 text-foreground" />
            </motion.div>

            <h1 className="text-4xl font-display font-bold mb-4 text-gradient-gold">
              Family Quest Dashboard
            </h1>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Connect your family's Habitica accounts to get a bird's-eye view of 
              everyone's habits, dailies, and to-dos. Track progress together and 
              conquer your quests as a family!
            </p>

            <Card className="glass-card mb-6 text-left">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">What you'll need:</p>
                    <p className="text-sm text-muted-foreground">
                      Each family member's Habitica User ID and API Token
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-healer mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Where to find them:</p>
                    <p className="text-sm text-muted-foreground">
                      Habitica → Settings → Site Data (API section)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Security:</p>
                    <p className="text-sm text-muted-foreground">
                      Credentials are encrypted and stored locally on your device
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow-primary"
                onClick={() => setStep('passphrase')}
              >
                Begin Setup
                <ChevronRight className="ml-2" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={handleDemoMode}
              >
                <Play className="mr-2" size={18} />
                Try Demo Mode
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'passphrase' && (
          <motion.div
            key="passphrase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full"
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Lock className="text-primary" />
                  Create Family Passphrase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This passphrase will encrypt your family's Habitica credentials. 
                  You'll need it to unlock the dashboard.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="passphrase">Passphrase</Label>
                  <Input
                    id="passphrase"
                    type="password"
                    placeholder="Enter a secure passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Passphrase</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Confirm your passphrase"
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-primary to-primary-glow"
                  onClick={handlePassphraseSubmit}
                >
                  Continue
                  <ChevronRight className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'members' && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                <Users className="text-primary" />
                Add Family Members
              </h2>
              <span className="text-muted-foreground">
                {members.length} added
              </span>
            </div>

            {/* Added Members */}
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card"
                    style={{ borderColor: m.color }}
                  >
                    <span style={{ color: m.color }}>{m.avatarEmoji}</span>
                    <span className="text-sm font-medium">{m.displayName}</span>
                  </div>
                ))}
              </div>
            )}

            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                {/* Display Name & Avatar */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input
                      placeholder="e.g., Dad, Mom, Emma..."
                      value={currentMember.displayName}
                      onChange={(e) =>
                        setCurrentMember({ ...currentMember, displayName: e.target.value })
                      }
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Avatar</Label>
                    <div className="flex gap-1">
                      {MEMBER_AVATARS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() =>
                            setCurrentMember({ ...currentMember, avatarEmoji: emoji })
                          }
                          className={cn(
                            "w-9 h-9 rounded-lg text-lg transition-all",
                            currentMember.avatarEmoji === emoji
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

                {/* Color Selection */}
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {MEMBER_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() =>
                          setCurrentMember({ ...currentMember, color: color.value })
                        }
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          currentMember.color === color.value
                            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                            : "hover:scale-105"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Habitica Credentials */}
                <div className="space-y-2">
                  <Label>Habitica User ID</Label>
                  <Input
                    placeholder="Enter User ID from Habitica settings"
                    value={currentMember.habiticaUserId}
                    onChange={(e) =>
                      setCurrentMember({ ...currentMember, habiticaUserId: e.target.value })
                    }
                    className="bg-input border-border font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Habitica API Token</Label>
                  <Input
                    type="password"
                    placeholder="Enter API Token from Habitica settings"
                    value={currentMember.habiticaApiToken}
                    onChange={(e) =>
                      setCurrentMember({ ...currentMember, habiticaApiToken: e.target.value })
                    }
                    className="bg-input border-border font-mono text-sm"
                  />
                </div>

                {/* Test & Add Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex-1"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>

                  <Button
                    onClick={handleAddMember}
                    disabled={!testResult?.success}
                    className="flex-1 bg-gradient-to-r from-healer to-green-400"
                  >
                    <Plus className="mr-2" size={18} />
                    Add Member
                  </Button>
                </div>

                {/* Test Result */}
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
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-end">
              <Button
                size="lg"
                onClick={handleComplete}
                className="bg-gradient-to-r from-accent to-yellow-400 text-accent-foreground glow-gold"
              >
                Complete Setup
                <Sparkles className="ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-healer to-green-400 flex items-center justify-center"
            >
              <Check className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-3xl font-display font-bold text-gradient-gold mb-2">
              Setup Complete!
            </h2>
            <p className="text-muted-foreground">
              Loading your family dashboard...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
