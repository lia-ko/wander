import { create } from "zustand";
import type { Trip } from "@/types";

interface UndoState {
  /** Snapshot of trips + active IDs before the last destructive action */
  snapshot: {
    trips: Trip[];
    activeTripId: number;
    activeDayId: number;
  } | null;
  label: string | null;
  saveSnapshot: (trips: Trip[], activeTripId: number, activeDayId: number, label: string) => void;
  clearSnapshot: () => void;
}

export const useUndoStore = create<UndoState>()((set) => ({
  snapshot: null,
  label: null,
  saveSnapshot: (trips, activeTripId, activeDayId, label) =>
    set({ snapshot: { trips, activeTripId, activeDayId }, label }),
  clearSnapshot: () => set({ snapshot: null, label: null }),
}));
