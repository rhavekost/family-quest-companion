import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFamilyStore } from "@/store/familyStore";
import { Lock, KeyRound, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UnlockScreenProps {
  onUnlock: () => void;
}

export function UnlockScreen({ onUnlock }: UnlockScreenProps) {
  const [passphrase, setPassphrase] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const { unlockWithPassphrase } = useFamilyStore();

  const handleUnlock = () => {
    setIsUnlocking(true);
    
    setTimeout(() => {
      const success = unlockWithPassphrase(passphrase);
      
      if (success) {
        toast({
          title: "Welcome back!",
          description: "Dashboard unlocked successfully",
        });
        onUnlock();
      } else {
        toast({
          title: "Invalid passphrase",
          description: "Please check your passphrase and try again",
          variant: "destructive",
        });
      }
      setIsUnlocking(false);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUnlock();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary"
          >
            <Sparkles className="w-10 h-10 text-foreground" />
          </motion.div>
          
          <h1 className="text-3xl font-display font-bold text-gradient-gold">
            Family Quest
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter your family passphrase to unlock
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <Lock className="text-primary" size={20} />
              Unlock Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="password"
                placeholder="Enter family passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-input border-border pl-10"
                autoFocus
              />
            </div>

            <Button
              onClick={handleUnlock}
              disabled={isUnlocking || !passphrase}
              className="w-full bg-gradient-to-r from-primary to-primary-glow"
            >
              {isUnlocking ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Lock size={18} />
                </motion.div>
              ) : (
                "Unlock"
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
