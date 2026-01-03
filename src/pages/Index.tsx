import { useState, useEffect } from "react";
import { useFamilyStore } from "@/store/familyStore";
import { SetupWizard } from "@/components/SetupWizard";
import { UnlockScreen } from "@/components/UnlockScreen";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  const { isSetupComplete, isUnlocked, encryptedData } = useFamilyStore();
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // If unlocked and setup is complete, show dashboard
    if (isUnlocked && isSetupComplete) {
      setShowDashboard(true);
    }
  }, [isUnlocked, isSetupComplete]);

  // First time user - show setup wizard
  if (!isSetupComplete) {
    return (
      <SetupWizard
        onComplete={() => {
          setShowDashboard(true);
        }}
      />
    );
  }

  // Returning user - needs to unlock
  if (!isUnlocked) {
    return (
      <UnlockScreen
        onUnlock={() => {
          setShowDashboard(true);
        }}
      />
    );
  }

  // Show dashboard
  return <Dashboard />;
};

export default Index;
