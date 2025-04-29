import { create } from 'zustand';

interface DashboardUIState {
    searchSelectedNodeId: string | null;
    setSearchSelectedNodeId: (id: string) => void;
}

export const useDashboardUI = create<DashboardUIState>((set) => ({
    searchSelectedNodeId: null,
    setSearchSelectedNodeId: (id: string) => set({ searchSelectedNodeId: id }),
}));