import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Trip, Day, Pin, Hotel, Expense, BudgetConfig } from "@/types";
import { DAY_COLORS } from "./constants";
import { useUndoStore } from "./undoStore";
import { useUIStore } from "./uiStore";
import { toast } from "./toastStore";

interface TripState {
  trips: Trip[];
  activeTripId: number;
  activeDayId: number;
  sidebarWidth: number;
  darkMode: boolean;

  // Actions
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

  // Pin CRUD
  addPin: (dayId: number, pin: Omit<Pin, "id" | "pinType"> & { pinType?: Pin["pinType"] }) => void;
  updatePin: (dayId: number, pinId: number, updates: Partial<Pin>) => void;
  removePin: (dayId: number, pinId: number) => void;
  reorderPin: (dayId: number, fromIndex: number, toIndex: number) => void;
  movePinToDay: (fromDayId: number, pinId: number, toDayId: number) => void;

  // Hotels
  addHotel: (hotel: Omit<Hotel, "id" | "notes" | "checkIn" | "checkOut"> & { notes?: string | null; checkIn?: string | null; checkOut?: string | null }) => void;
  updateHotel: (hotelId: string, updates: Partial<Pick<Hotel, "notes" | "checkIn" | "checkOut">>) => void;
  removeHotel: (hotelId: string) => void;

  // Wishlist
  addToWishlist: (pin: Omit<Pin, "id" | "pinType"> & { pinType?: Pin["pinType"] }) => void;
  removeFromWishlist: (pinId: number) => void;
  moveWishlistToDay: (pinId: number, dayId: number, insertIndex?: number) => void;
  movePinToWishlist: (dayId: number, pinId: number) => void;

  // Budget
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

let nextId = 0;
const genId = () => {
  const now = Date.now();
  nextId = now > nextId ? now : nextId + 1;
  return nextId;
};

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

/** Save a snapshot before a destructive action (UndoBar in sidebar handles the UI) */
function snapBeforeAction(get: () => TripState, label: string) {
  const s = get();
  useUndoStore.getState().saveSnapshot(s.trips, s.activeTripId, s.activeDayId, label);
}

/** Safely resolve the active trip, falling back to trips[0] if activeTripId is stale */
function activeTrip(s: { trips: Trip[]; activeTripId: number }): Trip {
  return s.trips.find((t) => t.id === s.activeTripId) ?? s.trips[0];
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
function mapActiveTrip(s: TripState, fn: (trip: Trip) => Trip): Trip[] {
  return s.trips.map((t) => (t.id === s.activeTripId ? fn(t) : t));
}

/** Map over a specific day within the active trip */
function mapActiveDay(s: TripState, dayId: number, fn: (day: Day) => Day): Trip[] {
  return mapActiveTrip(s, (t) => ({
    ...t,
    days: t.days.map((d) => (d.id === dayId ? fn(d) : d)),
  }));
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      trips: [defaultTrip],
      activeTripId: 1,
      activeDayId: 1,
      sidebarWidth: 310,
      darkMode: false,

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
          if (remaining.length === 0) return s; // don't delete the last trip
          const newActiveId = s.activeTripId === tripId ? remaining[0].id : s.activeTripId;
          const newActiveTrip = remaining.find((t) => t.id === newActiveId) ?? remaining[0];
          return {
            trips: remaining,
            activeTripId: newActiveTrip.id,
            activeDayId: newActiveTrip.days[0]?.id ?? 1,
          };
        });
      },

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
        const trip = get().trips.find((t) => t.id === get().activeTripId);
        const dayLabel = trip?.days.find((d) => d.id === dayId)?.label ?? "Day";
        snapBeforeAction(get, `Deleted ${dayLabel}`);
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({ ...t, days: t.days.filter((d) => d.id !== dayId) })),
          activeDayId: s.activeDayId === dayId ? activeTrip(s).days[0]?.id ?? 1 : s.activeDayId,
        }));
      },

      clearDay: (dayId) => {
        const trip = get().trips.find((t) => t.id === get().activeTripId);
        const day = trip?.days.find((d) => d.id === dayId);
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

      addPin: (dayId, pin) =>
        set((s) => ({
          trips: mapActiveDay(s, dayId, (d) => ({ ...d, pins: [...d.pins, { pinType: "location", ...pin, id: genId() }] })),
        })),

      updatePin: (dayId, pinId, updates) =>
        set((s) => ({
          trips: mapActiveDay(s, dayId, (d) => ({ ...d, pins: d.pins.map((p) => (p.id === pinId ? { ...p, ...updates } : p)) })),
        })),

      removePin: (dayId, pinId) => {
        const trip = get().trips.find((t) => t.id === get().activeTripId);
        const day = trip?.days.find((d) => d.id === dayId);
        const pinName = day?.pins.find((p) => p.id === pinId)?.name ?? "Stop";
        snapBeforeAction(get, `Removed "${pinName}"`);
        set((s) => ({
          trips: mapActiveDay(s, dayId, (d) => ({ ...d, pins: d.pins.filter((p) => p.id !== pinId) })),
        }));
        const ui = useUIStore.getState();
        if (ui.selectedPinId === pinId) ui.setSelectedPinId(null);
      },

      reorderPin: (dayId, fromIndex, toIndex) => {
        const trip = get().trips.find((t) => t.id === get().activeTripId);
        const day = trip?.days.find((d) => d.id === dayId);
        const pinName = day?.pins[fromIndex]?.name ?? "stop";
        snapBeforeAction(get, `Reordered "${pinName}"`);
        set((s) => ({
          trips: mapActiveDay(s, dayId, (d) => {
            const pins = [...d.pins];
            const [moved] = pins.splice(fromIndex, 1);
            pins.splice(toIndex, 0, moved);
            return { ...d, pins };
          }),
        }));
      },

      movePinToDay: (fromDayId, pinId, toDayId) => {
        if (fromDayId === toDayId) return;
        const trip = get().trips.find((t) => t.id === get().activeTripId);
        const fromDay = trip?.days.find((d) => d.id === fromDayId);
        const toDay = trip?.days.find((d) => d.id === toDayId);
        const pin = fromDay?.pins.find((p) => p.id === pinId);
        if (!pin || !toDay) return;
        snapBeforeAction(get, `Moved "${pin.name}" to ${toDay.label}`);
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({
            ...t,
            days: t.days.map((d) => {
              if (d.id === fromDayId) return { ...d, pins: d.pins.filter((p) => p.id !== pinId) };
              if (d.id === toDayId) return { ...d, pins: [...d.pins, { ...pin, transport: null, travelTime: null }] };
              return d;
            }),
          })),
        }));
      },

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
        const trip = get().trips.find((t) => t.id === get().activeTripId);
        const hotelName = trip?.hotels.find((h) => h.id === hotelId)?.name ?? "Hotel";
        snapBeforeAction(get, `Removed "${hotelName}"`);
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({ ...t, hotels: t.hotels.filter((h) => h.id !== hotelId) })),
        }));
      },

      addToWishlist: (pin) =>
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({
            ...t, wishlist: [...(t.wishlist ?? []), { pinType: "location", ...pin, id: genId() }],
          })),
        })),

      removeFromWishlist: (pinId) => {
        const trip = get().trips.find((t) => t.id === get().activeTripId);
        const pinName = (trip?.wishlist ?? []).find((p) => p.id === pinId)?.name ?? "Item";
        snapBeforeAction(get, `Removed "${pinName}" from wishlist`);
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({ ...t, wishlist: (t.wishlist ?? []).filter((p) => p.id !== pinId) })),
        }));
      },

      moveWishlistToDay: (pinId, dayId, insertIndex) => {
        const trip = get().trips.find((t) => t.id === get().activeTripId);
        const pin = (trip?.wishlist ?? []).find((p) => p.id === pinId);
        const day = trip?.days.find((d) => d.id === dayId);
        if (pin) snapBeforeAction(get, `Moved "${pin.name}" to ${day?.label ?? "day"}`);
        set((s) => ({
          trips: mapActiveTrip(s, (t) => {
            const wl = t.wishlist ?? [];
            const p = wl.find((w) => w.id === pinId);
            if (!p) return t;
            return {
              ...t,
              wishlist: wl.filter((w) => w.id !== pinId),
              days: t.days.map((d) => {
                if (d.id !== dayId) return d;
                const pins = [...d.pins];
                if (insertIndex !== undefined && insertIndex >= 0) {
                  pins.splice(insertIndex, 0, p);
                } else {
                  pins.push(p);
                }
                return { ...d, pins };
              }),
            };
          }),
        }));
      },

      movePinToWishlist: (dayId, pinId) => {
        const trip = get().trips.find((t) => t.id === get().activeTripId);
        const day = trip?.days.find((d) => d.id === dayId);
        const pin = day?.pins.find((p) => p.id === pinId);
        if (pin) snapBeforeAction(get, `Moved "${pin.name}" to wishlist`);
        set((s) => ({
          trips: mapActiveTrip(s, (t) => {
            const d = t.days.find((dy) => dy.id === dayId);
            const p = d?.pins.find((px) => px.id === pinId);
            if (!p) return t;
            return {
              ...t,
              wishlist: [...(t.wishlist ?? []), { ...p, transport: null, travelTime: null, startTime: undefined }],
              days: t.days.map((dy) =>
                dy.id === dayId ? { ...dy, pins: dy.pins.filter((px) => px.id !== pinId) } : dy
              ),
            };
          }),
        }));
        const ui = useUIStore.getState();
        if (ui.selectedPinId === pinId) ui.setSelectedPinId(null);
      },

      setBudget: (config) =>
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({
            ...t, budget: { ...(t.budget ?? { currency: "USD", totalBudget: null }), ...config },
          })),
        })),

      addExpense: (expense) =>
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({
            ...t, expenses: [...(t.expenses ?? []), { ...expense, id: genId() }],
          })),
        })),

      updateExpense: (expenseId, updates) =>
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({
            ...t, expenses: (t.expenses ?? []).map((e) => (e.id === expenseId ? { ...e, ...updates } : e)),
          })),
        })),

      removeExpense: (expenseId) => {
        const trip = get().trips.find((t) => t.id === get().activeTripId);
        const expName = (trip?.expenses ?? []).find((e) => e.id === expenseId)?.name ?? "Expense";
        snapBeforeAction(get, `Removed "${expName}"`);
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({
            ...t, expenses: (t.expenses ?? []).filter((e) => e.id !== expenseId),
          })),
        }));
      },

      clearAllExpenses: () => {
        const trip = get().trips.find((t) => t.id === get().activeTripId);
        const count = (trip?.expenses ?? []).length;
        if (count === 0) return;
        snapBeforeAction(get, `Cleared ${count} expense${count > 1 ? "s" : ""}`);
        set((s) => ({
          trips: mapActiveTrip(s, (t) => ({ ...t, expenses: [] })),
        }));
      },

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
      version: 8,
      migrate: (persisted: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persisted as any;
        const transportMap: Record<string, string> = {
          train: "transit", subway: "transit", bus: "transit",
          ferry: "transit", taxi: "car", bike: "walk",
        };
        if (Array.isArray(state.trips)) {
          const seenIds = new Set<number>();
          let rekeySeed = Date.now();
          for (const trip of state.trips) {
            if (!trip.center) trip.center = { lat: 0, lng: 0 };
            if (!trip.destination) trip.destination = "";
            if (!trip.startDate) trip.startDate = null;
            // v5: migrate hotel → hotels array
            if (!Array.isArray(trip.hotels)) {
              trip.hotels = trip.hotel ? [trip.hotel] : [];
              delete trip.hotel;
            }
            // v7: wishlist
            if (!Array.isArray(trip.wishlist)) trip.wishlist = [];
            // v8: budget tracking
            if (!Array.isArray(trip.expenses)) trip.expenses = [];
            if (!trip.budget) trip.budget = { currency: "USD", totalBudget: null };
            // v6: hotel notes
            if (Array.isArray(trip.hotels)) {
              for (const hotel of trip.hotels) {
                if (hotel.notes === undefined) hotel.notes = null;
                if (hotel.checkIn === undefined) hotel.checkIn = null;
                if (hotel.checkOut === undefined) hotel.checkOut = null;
              }
            }
            if (Array.isArray(trip.days)) {
              for (const day of trip.days) {
                if (Array.isArray(day.pins)) {
                  for (const pin of day.pins) {
                    if (pin.transport && transportMap[pin.transport]) {
                      pin.transport = transportMap[pin.transport];
                    }
                    if (seenIds.has(pin.id)) {
                      pin.id = ++rekeySeed;
                    }
                    seenIds.add(pin.id);
                    // v6: pin type
                    if (!pin.pinType) pin.pinType = "location";
                  }
                }
              }
            }
          }
        }
        return state;
      },
    }
  )
);
