import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import CryptoJS from 'crypto-js';
import { FamilyMember } from '@/types/habitica';

interface FamilyStore {
  familyMembers: FamilyMember[];
  encryptedData: string | null;
  isUnlocked: boolean;
  passphrase: string | null;
  isSetupComplete: boolean;
  isDemoMode: boolean;
  
  // Actions
  addMember: (member: FamilyMember) => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  setPassphrase: (passphrase: string) => void;
  unlockWithPassphrase: (passphrase: string) => boolean;
  lock: () => void;
  completeSetup: () => void;
  resetAll: () => void;
  encryptAndSave: () => void;
  enableDemoMode: (members: FamilyMember[]) => void;
  exitDemoMode: () => void;
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

      unlockWithPassphrase: (passphrase) => {
        const { encryptedData } = get();
        if (!encryptedData) {
          set({ passphrase, isUnlocked: true });
          return true;
        }

        try {
          const bytes = CryptoJS.AES.decrypt(encryptedData, passphrase);
          const decrypted = bytes.toString(CryptoJS.enc.Utf8);
          if (decrypted) {
            const members = JSON.parse(decrypted) as FamilyMember[];
            set({ familyMembers: members, passphrase, isUnlocked: true });
            return true;
          }
          return false;
        } catch {
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

      encryptAndSave: () => {
        const { familyMembers, passphrase, isDemoMode } = get();
        if (isDemoMode) return;
        if (passphrase && familyMembers.length > 0) {
          const encrypted = CryptoJS.AES.encrypt(
            JSON.stringify(familyMembers),
            passphrase
          ).toString();
          set({ encryptedData: encrypted });
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
    }),
    {
      name: 'family-quest-storage',
      partialize: (state) => ({
        encryptedData: state.encryptedData,
        isSetupComplete: state.isSetupComplete,
      }),
    }
  )
);
