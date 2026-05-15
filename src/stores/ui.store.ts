import { create } from 'zustand';

interface UIState {
  sideRailMode: 'auto' | 'collapsed';
  setSideRailMode: (mode: 'auto' | 'collapsed') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sideRailMode: 'auto',
  setSideRailMode: (mode) => set({ sideRailMode: mode }),
}));
