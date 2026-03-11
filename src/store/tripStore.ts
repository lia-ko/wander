import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Trip, Day, Pin, Hotel, Expense, BudgetConfig } from "@/types";
import { DAY_COLORS } from "./constants";
import { useUndoStore } from "./undoStore";
import { useUIStore } from "./uiStore";
import { toast } from "./toastStore";
import { SCHEMA_VERSION, migratePersistedState } from "./migrations";
import { createPinActions } from "./slices/pinActions";
import { createBudgetActions } from "./slices/budgetActions";

// ── Types exported for slices ──

export type StoreSet = (fn: TripState | Partial<TripState> | ((s: TripState) => Partial<TripState>)) => void;
export type StoreGet = () => TripState;

export interface TripState {
  trips: Trip[];
  activeTripId: number;
  activeDayId: number;
  sidebarWidth: number;
  darkMode: boolean;

  // UI
  setActiveTripId: (id: number) => void;
  setActiveDayId: (id: number) => void;
  setSidebarWidth: (w: number) => void;
  toggleDarkMode: () => void;

  // Trip CRUD
  addTrip: (name: string, emoji: string, dates: string, destination: string, center: { lat: number; lng: number }, startDate?: string | null) => void;
  updateTrip: (tripId: number, updates: Partial<Pick<Trip, "name" | "emoji" | "dates" | "startDate">>) => void;
  removeTrip: (tripId: number) => void;

  // Day CRUD
  addDay: () => void;
  removeDay: (dayId: number) => void;
  clearDay: (dayId: number) => void;
  updateDay: (dayId: number, updates: Partial<Pick<Day, "label" | "sublabel">>) => void;

  // Pin CRUD (slice)
  addPin: (dayId: number, pin: Omit<Pin, "id" | "pinType"> & { pinType?: Pin["pinType"] }) => void;
  updatePin: (dayId: number, pinId: number, updates: Partial<Pin>) => void;
  removePin: (dayId: number, pinId: number) => void;
  reorderPin: (dayId: number, fromIndex: number, toIndex: number) => void;
  movePinToDay: (fromDayId: number, pinId: number, toDayId: number) => void;

  // Hotels
  addHotel: (hotel: Omit<Hotel, "id" | "notes" | "checkIn" | "checkOut"> & { notes?: string | null; checkIn?: string | null; checkOut?: string | null }) => void;
  updateHotel: (hotelId: string, updates: Partial<Pick<Hotel, "notes" | "checkIn" | "checkOut">>) => void;
  removeHotel: (hotelId: string) => void;

  // Wishlist (slice)
  addToWishlist: (pin: Omit<Pin, "id" | "pinType"> & { pinType?: Pin["pinType"] }) => void;
  removeFromWishlist: (pinId: number) => void;
  updateWishlistItem: (pinId: number, updates: Partial<Pin>) => void;
  moveWishlistToDay: (pinId: number, dayId: number, insertIndex?: number) => void;
  movePinToWishlist: (dayId: number, pinId: number) => void;

  // Budget (slice)
  setBudget: (config: Partial<BudgetConfig>) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (expenseId: number, updates: Partial<Expense>) => void;
  removeExpense: (expenseId: number) => void;
  clearAllExpenses: () => void;

  // Import/Export
  importTrips: (trips: Trip[]) => void;

  // Undo
  undo: () => void;

  // Helpers
  getActiveTrip: () => Trip;
  getActiveDay: () => Day;
}

// ── Shared utilities (exported for slices) ──

let nextId = 0;
export const genId = () => {
  const now = Date.now();
  nextId = now > nextId ? now : nextId + 1;
  return nextId;
};

/** Safely resolve the active trip, falling back to trips[0] if activeTripId is stale */
function activeTrip(s: { trips: Trip[]; activeTripId: number }): Trip {
  return s.trips.find((t) => t.id === s.activeTripId) ?? s.trips[0];
}

/** For use in slices: resolve the active trip from get() */
export function getActiveTrip(get: StoreGet): Trip {
  return activeTrip(get());
}

/** Safely resolve a day within a trip, falling back to days[0] */
function activeDay(trip: Trip, dayId: number): Day {
  return trip.days.find((d) => d.id === dayId) ?? trip.days[0];
}

/** Zustand selector: returns the active trip (safe, never throws) */
export const selectActiveTrip = (s: TripState): Trip => activeTrip(s);

/** Zustand selector: returns the active day (safe, never throws) */
export const selectActiveDay = (s: TripState): Day => activeDay(activeTrip(s), s.activeDayId);

/** Map over the active trip, leaving other trips untouched */
export function mapActiveTrip(s: TripState, fn: (trip: Trip) => Trip): Trip[] {
  return s.trips.map((t) => (t.id === s.activeTripId ? fn(t) : t));
}

/** Map over a specific day within the active trip */
export function mapActiveDay(s: TripState, dayId: number, fn: (day: Day) => Day): Trip[] {
  return mapActiveTrip(s, (t) => ({
    ...t,
    days: t.days.map((d) => (d.id === dayId ? fn(d) : d)),
  }));
}

/** Save a snapshot before a destructive action */
export function snapBeforeAction(get: StoreGet, label: string) {
  const s = get();
  useUndoStore.getState().saveSnapshot(s.trips, s.activeTripId, s.activeDayId, label);
}

// ── Default data ──

const defaultTrip: Trip = {
  id: 1,
  name: "Tokyo Spring",
  emoji: "\u{1F338}",
  dates: "Apr 3\u20139",
  startDate: null,
  destination: "Tokyo, Japan",
  center: { lat: 35.6895, lng: 139.7500 },
  hotels: [],
  wishlist: [],
  expenses: [],
  budget: { currency: "USD", totalBudget: null },
  days: [
    { id: 1, label: "Day 1", sublabel: "", color: DAY_COLORS[0], pins: [] },
  ],
};

// ── Store ──

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      trips: [defaultTrip],
      activeTripId: 1,
      activeDayId: 1,
      sidebarWidth: 310,
      darkMode: false,

      // ── UI ──

      setActiveTripId: (id) => {
        const trip = get().trips.find((t) => t.id === id);
        set({ activeTripId: id, activeDayId: trip?.days[0]?.id ?? 1 });
        useUIStore.getState().setSidebarView("day");
      },
      setActiveDayId: (id) => {
        set({ activeDayId: id });
        useUIStore.getState().setSidebarView("day");
      },
      setSidebarWidth: (w) => set({ sidebarWidth: Math.max(280, Math.min(500, w)) }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      // ── Trip CRUD ──

      addTrip: (name, emoji, dates, destination, center, startDate) => {
        const id = genId();
        const trip: Trip = {
          id,
          name,
          emoji,
          dates,
          startDate: startDate || null,
          destination,
          center,
          hotels: [],
          wishlist: [],
          expenses: [],
          budget: { currency: "USD", totalBudget: null },
          days: [{ id: genId(), label: "Day 1", sublabel: "", color: DAY_COLORS[0], pins: [] }],
        };
        set((s) => ({ trips: [...s.trips, trip], activeTripId: id, activeDayId: trip.days[0].id }));
        useUIStore.getState().setSidebarView("day");
      },

      updateTrip: (tripId, updates) =>
        set((s) => ({
          trips: s.trips.map((t) => (t.id === tripId ? { ...t, ...updates } : t)),
        })),

      removeTrip: (tripId) => {
        const tripName = get().trips.find((t) => t.id === tripId)?.name ?? "Trip";
        snapBeforeAction(get, `Deleted trip "${tripName}"`);
        set((s) => {
          const remaining = s.trips.filter((t) => t.id !== tripId);
          if (remaining.length === 0) return s;
          const newActiveId = s.activeTripId === tripId ? remaining[0].id : s.activeTripId;
          const newActiveTrip = remaining.find((t) => t.id === newActiveId) ?? remaining[0];
          return {
            trips: remaining,
            activeTripId: newActiveTrip.id,
            activeDayId: newActiveTrip.days[0]?.id ?? 1,
          };
        });
      },

      // ── Day CRUD ──

      addDay: () =>
        set((s) => {
          const trip = activeTrip(s);
          const dayIndex = trip.days.length;
          const newDay: Day = {
            id: genId(),
            label: `Day ${dayIndex + 1}`,
            sublabel: "",
            color: DAY_COLORS[dayIndex % DAY_COLORS.length],
            pins: [],
          };
          return {
            trips: mapActiveTrip(s, (t) => ({ ...t, days: [...t.days, newDay] })),
            activeDayId: newDay.id,
          };
        }),

      removeDay: (dayId) => {
        const trip = getActiveTrip(get);
        const dayLabel = trip.days.find((d) => d.id === dayId)?.label ?? "Day";
        snapBeforeAction(get, `Deleted ${dayLabel}`);
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({ ...t, days: t.days.filter((d) => d.id !== dayId) })),
          activeDayId: s.activeDayId === dayId ? activeTrip(s).days[0]?.id ?? 1 : s.activeDayId,
        }));
      },

      clearDay: (dayId) => {
        const trip = getActiveTrip(get);
        const day = trip.days.find((d) => d.id === dayId);
        const count = day?.pins.length ?? 0;
        if (count === 0) return;
        snapBeforeAction(get, `Cleared ${count} stop${count > 1 ? "s" : ""} from ${day?.label ?? "day"}`);
        set((s) => ({
          trips: mapActiveDay(s, dayId, (d) => ({ ...d, pins: [] })),
        }));
        useUIStore.getState().setSelectedPinId(null);
      },

      updateDay: (dayId, updates) =>
        set((s) => ({
          trips: mapActiveDay(s, dayId, (d) => ({ ...d, ...updates })),
        })),

      // ── Hotels ──

      addHotel: (hotel) =>
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({
            ...t, hotels: [...t.hotels, { notes: null, checkIn: null, checkOut: null, ...hotel, id: `hotel-${genId()}` }],
          })),
        })),

      updateHotel: (hotelId, updates) =>
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({
            ...t, hotels: t.hotels.map((h) => (h.id === hotelId ? { ...h, ...updates } : h)),
          })),
        })),

      removeHotel: (hotelId) => {
        const trip = getActiveTrip(get);
        const hotelName = trip.hotels.find((h) => h.id === hotelId)?.name ?? "Hotel";
        snapBeforeAction(get, `Removed "${hotelName}"`);
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({ ...t, hotels: t.hotels.filter((h) => h.id !== hotelId) })),
        }));
      },

      // ── Pin + Wishlist (slice) ──
      ...createPinActions(set, get),

      // ── Budget + Expenses (slice) ──
      ...createBudgetActions(set, get),

      // ── Import / Undo / Helpers ──

      importTrips: (trips) => {
        set(() => ({
          trips,
          activeTripId: trips[0].id,
          activeDayId: trips[0].days[0]?.id ?? 1,
        }));
        useUIStore.getState().setSidebarView("day");
      },

      undo: () => {
        const snap = useUndoStore.getState().snapshot;
        if (!snap) return;
        set({
          trips: snap.trips,
          activeTripId: snap.activeTripId,
          activeDayId: snap.activeDayId,
        });
        useUndoStore.getState().clearSnapshot();
        toast("Undone!", "success");
      },

      getActiveTrip: () => activeTrip(get()),

      getActiveDay: () => {
        const s = get();
        return activeDay(activeTrip(s), s.activeDayId);
      },
    }),
    {
      name: "wander-trips",
      version: SCHEMA_VERSION,
      migrate: migratePersistedState,
    }
  )
);
