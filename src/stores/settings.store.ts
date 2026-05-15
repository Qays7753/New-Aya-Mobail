import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  receiptHeader: string;
  receiptFooter: string;
  taxPercent: number;
}

interface SettingsState {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        storeName: 'متجري',
        storePhone: '',
        storeAddress: '',
        receiptHeader: '',
        receiptFooter: 'شكراً لزيارتكم',
        taxPercent: 0,
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'pos-settings',
    }
  )
);
