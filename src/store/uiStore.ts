import { create } from "zustand";
import type { DiscoverTab } from "@/types";

interface UIState {
  selectedPinId: number | null;
  radiusCenter: { lat: number; lng: number; label: string } | null;
  sidebarCollapsed: boolean;
  sidebarView: "day" | "wishlist" | "budget";
  discoverOpen: boolean;
  discoverTab: DiscoverTab;
  newTripModalOpen: boolean;

  setSelectedPinId: (id: number | null) => void;
  setRadiusCenter: (center: { lat: number; lng: number; label: string } | null) => void;
  toggleSidebar: () => void;
  setSidebarView: (view: "day" | "wishlist" | "budget") => void;
  toggleDiscover: (tab?: DiscoverTab) => void;
  closeDiscover: () => void;
  setNewTripModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  selectedPinId: null,
  radiusCenter: null,
  sidebarCollapsed: false,
  sidebarView: "day",
  discoverOpen: false,
  discoverTab: "eat",
  newTripModalOpen: false,

  setSelectedPinId: (id) => set({ selectedPinId: id }),
  setRadiusCenter: (center) => set({ radiusCenter: center }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarView: (view) => set({ sidebarView: view }),
  toggleDiscover: (tab) =>
    set((s) => {
      if (s.discoverOpen && tab && s.discoverTab === tab) return { discoverOpen: false };
      return { discoverOpen: true, discoverTab: tab ?? s.discoverTab };
    }),
  closeDiscover: () => set({ discoverOpen: false }),
  setNewTripModalOpen: (open) => set({ newTripModalOpen: open }),
}));
