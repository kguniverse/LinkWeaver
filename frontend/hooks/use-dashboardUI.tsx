import { create } from 'zustand';

interface DashboardUIState {
    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;
}

export const useDashboardUI = create<DashboardUIState>((set) => ({
    selectedNodeId: null,
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}));