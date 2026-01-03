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
}

export const useFamilyStore = create<FamilyStore>()(
  persist(
    (set, get) => ({
      familyMembers: [],
      encryptedData: null,
      isUnlocked: false,
      passphrase: null,
      isSetupComplete: false,

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
        get().encryptAndSave();
        set({ isUnlocked: false, passphrase: null, familyMembers: [] });
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
        });
      },

      encryptAndSave: () => {
        const { familyMembers, passphrase } = get();
        if (passphrase && familyMembers.length > 0) {
          const encrypted = CryptoJS.AES.encrypt(
            JSON.stringify(familyMembers),
            passphrase
          ).toString();
          set({ encryptedData: encrypted });
        }
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
