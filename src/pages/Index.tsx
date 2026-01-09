import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFamilyStore } from "@/store/familyStore";
import { SetupWizard } from "@/components/SetupWizard";
import { UnlockScreen } from "@/components/UnlockScreen";
import { Dashboard } from "@/components/Dashboard";
import { FamilyIdPrompt } from "@/components/FamilyIdPrompt";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { familyId: urlFamilyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();
  const { 
    isSetupComplete, 
    isUnlocked, 
    serverHasVault, 
    setFamilyId,
    familyId: storedFamilyId,
  } = useFamilyStore();
  
  const [showDashboard, setShowDashboard] = useState(false);
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  const [hasExistingVault, setHasExistingVault] = useState(false);
  const [needsFamilyId, setNeedsFamilyId] = useState(false);

  // Determine the active family ID (URL takes precedence)
  const activeFamilyId = urlFamilyId || storedFamilyId;

  useEffect(() => {
    // If no family ID anywhere, prompt for one
    if (!activeFamilyId) {
      setNeedsFamilyId(true);
      return;
    }

    // Set family ID in store if from URL
    if (urlFamilyId && urlFamilyId !== storedFamilyId) {
      setFamilyId(urlFamilyId);
    }

    // Check if server has a vault for this family
    const checkServer = async () => {
      setIsCheckingServer(true);
      setNeedsFamilyId(false);
      const hasVault = await serverHasVault();
      setHasExistingVault(hasVault);
      setIsCheckingServer(false);
    };
    
    checkServer();
  }, [activeFamilyId, urlFamilyId]);

  useEffect(() => {
    if (isUnlocked && (isSetupComplete || hasExistingVault)) {
      setShowDashboard(true);
    }
  }, [isUnlocked, isSetupComplete, hasExistingVault]);

  // Prompt for family ID
  if (needsFamilyId) {
    return (
      <FamilyIdPrompt 
        onSubmit={(id) => {
          navigate(`/${id}`);
        }} 
      />
    );
  }

  // Checking server for existing vault
  if (isCheckingServer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking for existing vault...</p>
        </div>
      </div>
    );
  }

  // Vault exists or local setup complete - show unlock screen
  if (hasExistingVault || isSetupComplete) {
    if (!isUnlocked) {
      return (
        <UnlockScreen
          onUnlock={() => setShowDashboard(true)}
        />
      );
    }
  }

  // No vault - first time setup for this family
  if (!isSetupComplete && !hasExistingVault) {
    return (
      <SetupWizard
        onComplete={() => setShowDashboard(true)}
      />
    );
  }

  return <Dashboard />;
};

export default Index;
