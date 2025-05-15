import { create } from 'zustand';

interface DashboardUIState {
    searchSelectedNodeId: string | null;
    setSearchSelectedNodeId: (id: string) => void;
    displayNodeId: string | null;
    setDisplayNodeId: (id: string) => void;
}

export const useDashboardUI = create<DashboardUIState>((set) => ({
    searchSelectedNodeId: null,
    setSearchSelectedNodeId: (id: string) => set({ searchSelectedNodeId: id }),
    displayNodeId: null,
    setDisplayNodeId: (id: string) => set({ displayNodeId: id })
}));