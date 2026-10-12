import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Language } from '../i18n';

interface SettingsState {
  language: Language;
  largeText: boolean;
  ownerWhatsApp?: string;
  setLanguage: (language: Language) => void;
  setLargeText: (largeText: boolean) => void;
  setOwnerWhatsApp: (ownerWhatsApp: string | undefined) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'hi',
      largeText: false,
      ownerWhatsApp: undefined,
      setLanguage: (language) => set({ language }),
      setLargeText: (largeText) => set({ largeText }),
      setOwnerWhatsApp: (ownerWhatsApp) => set({ ownerWhatsApp }),
    }),
    {
      name: 'rm-settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
