import { create } from 'zustand';

interface DashboardUIState {
    // The entity the graph is centered/expanded on. Changing this triggers a fresh expansion fetch.
    searchSelectedNodeId: string | null;
    setSearchSelectedNodeId: (id: string) => void;

    // The entity whose details are shown in the right panel. Tracked with history.
    displayNodeId: string | null;
    pastIds: string[];
    futureIds: string[];
    setDisplayNodeId: (id: string) => void;
    goBack: () => void;
    goForward: () => void;
    canGoBack: () => boolean;
    canGoForward: () => boolean;

    // Wipe all exploration state — used by the graph "Reset" button.
    resetExploration: () => void;
}

export const useDashboardUI = create<DashboardUIState>((set, get) => ({
    searchSelectedNodeId: null,
    setSearchSelectedNodeId: (id: string) => set({ searchSelectedNodeId: id }),

    displayNodeId: null,
    pastIds: [],
    futureIds: [],

    setDisplayNodeId: (id: string) => {
        const { displayNodeId, pastIds } = get();
        if (id === displayNodeId) return;
        const nextPast = displayNodeId ? [...pastIds, displayNodeId] : pastIds;
        set({ displayNodeId: id, pastIds: nextPast, futureIds: [] });
    },

    goBack: () => {
        const { displayNodeId, pastIds, futureIds } = get();
        if (pastIds.length === 0) return;
        const prev = pastIds[pastIds.length - 1];
        const nextPast = pastIds.slice(0, -1);
        const nextFuture = displayNodeId ? [displayNodeId, ...futureIds] : futureIds;
        set({ displayNodeId: prev, pastIds: nextPast, futureIds: nextFuture });
    },

    goForward: () => {
        const { displayNodeId, pastIds, futureIds } = get();
        if (futureIds.length === 0) return;
        const next = futureIds[0];
        const nextFuture = futureIds.slice(1);
        const nextPast = displayNodeId ? [...pastIds, displayNodeId] : pastIds;
        set({ displayNodeId: next, pastIds: nextPast, futureIds: nextFuture });
    },

    canGoBack: () => get().pastIds.length > 0,
    canGoForward: () => get().futureIds.length > 0,

    resetExploration: () =>
        set({
            searchSelectedNodeId: null,
            displayNodeId: null,
            pastIds: [],
            futureIds: [],
        }),
}));
