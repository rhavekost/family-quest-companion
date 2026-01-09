import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Users, ArrowRight } from "lucide-react";

interface FamilyIdPromptProps {
  onSubmit: (familyId: string) => void;
}

export function FamilyIdPrompt({ onSubmit }: FamilyIdPromptProps) {
  const [familyId, setFamilyId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const cleaned = familyId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!cleaned || cleaned.length < 2) {
      setError("Please enter a valid family name (at least 2 characters)");
      return;
    }
    onSubmit(cleaned);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
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
            Enter your family name to get started
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <Users className="text-primary" size={20} />
              Choose Family Name
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  family-quest.app/
                </span>
                <Input
                  type="text"
                  placeholder="smiths"
                  value={familyId}
                  onChange={(e) => {
                    setFamilyId(e.target.value);
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  className="bg-input border-border pl-[140px]"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                This will be your unique URL. Share it with family members so they can access the same dashboard.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!familyId.trim()}
              className="w-full bg-gradient-to-r from-primary to-primary-glow"
            >
              Continue
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
