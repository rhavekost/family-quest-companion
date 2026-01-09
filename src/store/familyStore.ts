import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import CryptoJS from 'crypto-js';
import { FamilyMember } from '@/types/habitica';

// API endpoint for server-side vault storage
const VAULT_API = '/api/vault';

interface FamilyStore {
  familyMembers: FamilyMember[];
  encryptedData: string | null;
  isUnlocked: boolean;
  passphrase: string | null;
  isSetupComplete: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncError: string | null;
  
  // Actions
  addMember: (member: FamilyMember) => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  setPassphrase: (passphrase: string) => void;
  unlockWithPassphrase: (passphrase: string) => Promise<boolean>;
  lock: () => void;
  completeSetup: () => void;
  resetAll: () => void;
  encryptAndSave: () => Promise<void>;
  enableDemoMode: (members: FamilyMember[]) => void;
  exitDemoMode: () => void;
  
  // Server sync
  fetchVaultFromServer: () => Promise<string | null>;
  saveVaultToServer: (encryptedData: string) => Promise<boolean>;
  
  // Migration helper - imports existing members from localStorage format
  importFromLocalStorage: (passphrase: string) => void;
}

export const useFamilyStore = create<FamilyStore>()(
  persist(
    (set, get) => ({
      familyMembers: [],
      encryptedData: null,
      isUnlocked: false,
      passphrase: null,
      isSetupComplete: false,
      isDemoMode: false,
      isLoading: false,
      isSyncing: false,
      lastSyncError: null,

      addMember: (member) => {
        set((state) => ({
          familyMembers: [...state.familyMembers, member],
        }));
        get().encryptAndSave();
      },

      removeMember: (id) => {
        set((state) => ({
          familyMembers: state.familyMembers.filter((m) => m.id !== id),
        }));
        get().encryptAndSave();
      },

      updateMember: (id, updates) => {
        set((state) => ({
          familyMembers: state.familyMembers.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
        get().encryptAndSave();
      },

      setPassphrase: (passphrase) => {
        set({ passphrase, isUnlocked: true });
      },

      fetchVaultFromServer: async () => {
        try {
          const response = await fetch(VAULT_API);
          if (response.status === 503) {
            // Server vault not configured, use local only
            console.log('Server vault not configured, using local storage');
            return null;
          }
          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }
          const data = await response.json();
          return data.vault || null;
        } catch (error) {
          console.error('Failed to fetch vault from server:', error);
          return null;
        }
      },

      saveVaultToServer: async (encryptedData: string) => {
        set({ isSyncing: true, lastSyncError: null });
        try {
          const response = await fetch(VAULT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vault: encryptedData }),
          });
          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }
          set({ isSyncing: false });
          return true;
        } catch (error) {
          console.error('Failed to save vault to server:', error);
          set({ isSyncing: false, lastSyncError: String(error) });
          return false;
        }
      },

      unlockWithPassphrase: async (passphrase) => {
        set({ isLoading: true });
        
        // First, try to fetch from server
        const serverVault = await get().fetchVaultFromServer();
        
        // Use server vault if available, otherwise fall back to local
        const { encryptedData: localVault } = get();
        const vaultToDecrypt = serverVault || localVault;
        
        if (!vaultToDecrypt) {
          // No vault exists yet - this is a fresh setup
          set({ passphrase, isUnlocked: true, isLoading: false });
          return true;
        }

        try {
          const bytes = CryptoJS.AES.decrypt(vaultToDecrypt, passphrase);
          const decrypted = bytes.toString(CryptoJS.enc.Utf8);
          if (decrypted) {
            const data = JSON.parse(decrypted);
            // Handle both old format (array) and new format (object with members)
            const members = Array.isArray(data) ? data : data.members || [];
            set({ 
              familyMembers: members as FamilyMember[], 
              passphrase, 
              isUnlocked: true,
              encryptedData: vaultToDecrypt,
              isSetupComplete: members.length > 0,
              isLoading: false,
            });
            
            // If we got data from server, update local cache
            if (serverVault && serverVault !== localVault) {
              set({ encryptedData: serverVault });
            }
            
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch {
          set({ isLoading: false });
          return false;
        }
      },

      lock: () => {
        const { isDemoMode } = get();
        if (isDemoMode) {
          set({ isDemoMode: false, isUnlocked: false, familyMembers: [] });
        } else {
          get().encryptAndSave();
          set({ isUnlocked: false, passphrase: null, familyMembers: [] });
        }
      },

      completeSetup: () => {
        set({ isSetupComplete: true });
        get().encryptAndSave();
      },

      resetAll: () => {
        set({
          familyMembers: [],
          encryptedData: null,
          isUnlocked: false,
          passphrase: null,
          isSetupComplete: false,
          isDemoMode: false,
        });
      },

      encryptAndSave: async () => {
        const { familyMembers, passphrase, isDemoMode } = get();
        if (isDemoMode) return;
        if (passphrase && familyMembers.length > 0) {
          // Store as object with members array for future extensibility
          const dataToEncrypt = JSON.stringify({ 
            members: familyMembers,
            version: 1,
          });
          const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, passphrase).toString();
          set({ encryptedData: encrypted });
          
          // Save to server
          await get().saveVaultToServer(encrypted);
        }
      },

      enableDemoMode: (members) => {
        set({
          familyMembers: members,
          isUnlocked: true,
          isDemoMode: true,
        });
      },

      exitDemoMode: () => {
        set({
          familyMembers: [],
          isUnlocked: false,
          isDemoMode: false,
        });
      },

      // Migration helper: call this once to import existing localStorage data to server
      importFromLocalStorage: (passphrase: string) => {
        const { familyMembers } = get();
        if (familyMembers.length > 0 && passphrase) {
          console.log(`Importing ${familyMembers.length} members to server vault...`);
          get().encryptAndSave();
        }
      },
    }),
    {
      name: 'family-quest-storage',
      partialize: (state) => ({
        // Keep local encrypted cache for offline/fallback
        encryptedData: state.encryptedData,
        isSetupComplete: state.isSetupComplete,
        // Also persist passphrase to localStorage for auto-unlock
        passphrase: state.passphrase,
      }),
    }
  )
);
