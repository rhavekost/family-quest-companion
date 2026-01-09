import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import CryptoJS from 'crypto-js';
import { FamilyMember } from '@/types/habitica';

// API endpoint for server-side vault storage
const VAULT_API = '/api/vault';

interface FamilyStore {
  familyMembers: FamilyMember[];
  memberOrder: string[]; // Array of member IDs in display order
  encryptedData: string | null;
  familyId: string | null;
  isUnlocked: boolean;
  passphrase: string | null;
  isSetupComplete: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncError: string | null;
  
  // Actions
  setFamilyId: (familyId: string) => void;
  addMember: (member: FamilyMember) => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  setMemberOrder: (memberIds: string[]) => void;
  getSortedMembers: () => FamilyMember[];
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
  serverHasVault: () => Promise<boolean>;
}

// Try to decrypt a vault with a passphrase
function tryDecrypt(encryptedData: string, passphrase: string): { members: FamilyMember[], memberOrder?: string[] } | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, passphrase);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (decrypted) {
      const data = JSON.parse(decrypted);
      // Handle both old format (array) and new format (object with members)
      const members = Array.isArray(data) ? data : data.members || [];
      const memberOrder = !Array.isArray(data) ? data.memberOrder : undefined;
      return { members, memberOrder };
    }
    return null;
  } catch {
    return null;
  }
}

export const useFamilyStore = create<FamilyStore>()(
  persist(
    (set, get) => ({
      familyMembers: [],
      memberOrder: [],
      encryptedData: null,
      familyId: null,
      isUnlocked: false,
      passphrase: null,
      isSetupComplete: false,
      isDemoMode: false,
      isLoading: false,
      isSyncing: false,
      lastSyncError: null,

      setFamilyId: (familyId) => {
        set({ familyId });
      },

      addMember: (member) => {
        set((state) => ({
          familyMembers: [...state.familyMembers, member],
          memberOrder: [...state.memberOrder, member.id],
        }));
        get().encryptAndSave();
      },

      removeMember: (id) => {
        set((state) => ({
          familyMembers: state.familyMembers.filter((m) => m.id !== id),
          memberOrder: state.memberOrder.filter((mId) => mId !== id),
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

      setMemberOrder: (memberIds) => {
        set({ memberOrder: memberIds });
        get().encryptAndSave();
      },

      getSortedMembers: () => {
        const { familyMembers, memberOrder } = get();
        
        // If no order is set, return members as-is
        if (memberOrder.length === 0) {
          return familyMembers;
        }
        
        // Create a map for quick lookups
        const memberMap = new Map(familyMembers.map(m => [m.id, m]));
        
        // Sort by memberOrder, then append any new members not in the order
        const sortedMembers = memberOrder
          .map(id => memberMap.get(id))
          .filter((m): m is FamilyMember => m !== undefined);
        
        // Add any members not in the order (newly added)
        const orderedIds = new Set(memberOrder);
        const newMembers = familyMembers.filter(m => !orderedIds.has(m.id));
        
        return [...sortedMembers, ...newMembers];
      },

      setPassphrase: (passphrase) => {
        set({ passphrase, isUnlocked: true });
      },

      fetchVaultFromServer: async () => {
        const { familyId } = get();
        if (!familyId) {
          console.error('No family ID set');
          return null;
        }

        try {
          const response = await fetch(`${VAULT_API}?familyId=${encodeURIComponent(familyId)}`);
          if (response.status === 503) {
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

      serverHasVault: async () => {
        const vault = await get().fetchVaultFromServer();
        return vault !== null;
      },

      saveVaultToServer: async (encryptedData: string) => {
        const { familyId } = get();
        if (!familyId) {
          console.error('No family ID set');
          return false;
        }

        set({ isSyncing: true, lastSyncError: null });
        try {
          const response = await fetch(`${VAULT_API}?familyId=${encodeURIComponent(familyId)}`, {
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
        
        // Fetch vault from server for this family
        const serverVault = await get().fetchVaultFromServer();
        
        // Try server vault first
        if (serverVault) {
          const result = tryDecrypt(serverVault, passphrase);
          if (result) {
            set({ 
              familyMembers: result.members,
              memberOrder: result.memberOrder || result.members.map(m => m.id),
              passphrase, 
              isUnlocked: true,
              encryptedData: serverVault,
              isSetupComplete: result.members.length > 0,
              isLoading: false,
            });
            return true;
          }
        }
        
        // Try local encrypted data as fallback
        const { encryptedData: localVault } = get();
        if (localVault) {
          const result = tryDecrypt(localVault, passphrase);
          if (result) {
            set({ 
              familyMembers: result.members,
              memberOrder: result.memberOrder || result.members.map(m => m.id),
              passphrase, 
              isUnlocked: true,
              isSetupComplete: result.members.length > 0,
              isLoading: false,
            });
            return true;
          }
        }
        
        // No vault exists yet - this is a fresh setup
        if (!serverVault && !localVault) {
          set({ passphrase, isUnlocked: true, isLoading: false });
          return true;
        }
        
        // If local vault decrypted but server didn't have it, sync to server
        if (!serverVault && localVault) {
          const localResult = tryDecrypt(localVault, passphrase);
          if (localResult) {
            set({ 
              familyMembers: localResult.members,
              memberOrder: localResult.memberOrder || localResult.members.map(m => m.id),
              passphrase, 
              isUnlocked: true,
              encryptedData: localVault,
              isSetupComplete: localResult.members.length > 0,
              isLoading: false,
            });
            // Auto-sync to server
            get().saveVaultToServer(localVault);
            return true;
          }
        }

        // Vault exists but passphrase didn't work
        set({ isLoading: false });
        return false;
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
          memberOrder: [],
          encryptedData: null,
          isUnlocked: false,
          passphrase: null,
          isSetupComplete: false,
          isDemoMode: false,
        });
      },

      encryptAndSave: async () => {
        const { familyMembers, memberOrder, passphrase, isDemoMode } = get();
        if (isDemoMode) return;
        if (passphrase && familyMembers.length > 0) {
          const dataToEncrypt = JSON.stringify({ 
            members: familyMembers,
            memberOrder,
            version: 2,
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
          memberOrder: members.map(m => m.id),
          isUnlocked: true,
          isDemoMode: true,
        });
      },

      exitDemoMode: () => {
        set({
          familyMembers: [],
          memberOrder: [],
          isUnlocked: false,
          isDemoMode: false,
        });
      },
    }),
    {
      name: 'family-quest-storage',
      partialize: (state) => ({
        encryptedData: state.encryptedData,
        familyId: state.familyId,
        isSetupComplete: state.isSetupComplete,
        passphrase: state.passphrase,
      }),
    }
  )
);
