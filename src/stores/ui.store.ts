import { create } from 'zustand';

interface UiState {
  isAdminUnlocked: boolean;
  isPinOpen: boolean;
  pinCallback: ((success: boolean) => void) | null;
  requestPin: () => Promise<boolean>;
  resolvePin: (success: boolean) => void;
  lockAdmin: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  isAdminUnlocked: false,
  isPinOpen: false,
  pinCallback: null,
  requestPin: () => {
    return new Promise<boolean>((resolve) => {
      if (get().isAdminUnlocked) {
        resolve(true); // Already unlocked
        return;
      }
      set({ isPinOpen: true, pinCallback: resolve });
    });
  },
  resolvePin: (success) => {
    set((state) => {
      if (state.pinCallback) state.pinCallback(success);
      return { 
        isPinOpen: false, 
        pinCallback: null,
        isAdminUnlocked: success || state.isAdminUnlocked 
      };
    });
  },
  lockAdmin: () => set({ isAdminUnlocked: false }),
}));
