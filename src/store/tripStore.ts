import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Trip, Day, Pin, Hotel, DiscoverTab } from "@/types";
import { DAY_COLORS } from "./constants";

interface TripState {
  trips: Trip[];
  activeTripId: number;
  activeDayId: number;
  selectedPinId: number | null;
  radiusCenter: { lat: number; lng: number; label: string } | null;
  discoverOpen: boolean;
  discoverTab: DiscoverTab;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  darkMode: boolean;
  newTripModalOpen: boolean;

  // Actions
  setActiveTripId: (id: number) => void;
  setActiveDayId: (id: number) => void;
  setSelectedPinId: (id: number | null) => void;
  setRadiusCenter: (center: { lat: number; lng: number; label: string } | null) => void;
  toggleDiscover: (tab?: DiscoverTab) => void;
  closeDiscover: () => void;
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  toggleDarkMode: () => void;
  setNewTripModalOpen: (open: boolean) => void;

  // Trip CRUD
  addTrip: (name: string, emoji: string, dates: string, destination: string, center: { lat: number; lng: number }, startDate?: string | null) => void;
  updateTrip: (tripId: number, updates: Partial<Pick<Trip, "name" | "emoji" | "dates" | "startDate">>) => void;
  removeTrip: (tripId: number) => void;

  // Day CRUD
  addDay: () => void;
  removeDay: (dayId: number) => void;
  updateDay: (dayId: number, updates: Partial<Pick<Day, "label" | "sublabel">>) => void;

  // Pin CRUD
  addPin: (dayId: number, pin: Omit<Pin, "id" | "pinType"> & { pinType?: Pin["pinType"] }) => void;
  updatePin: (dayId: number, pinId: number, updates: Partial<Pin>) => void;
  removePin: (dayId: number, pinId: number) => void;
  reorderPin: (dayId: number, fromIndex: number, toIndex: number) => void;

  // Hotels
  addHotel: (hotel: Omit<Hotel, "id" | "notes" | "checkIn" | "checkOut"> & { notes?: string | null; checkIn?: string | null; checkOut?: string | null }) => void;
  updateHotel: (hotelId: string, updates: Partial<Pick<Hotel, "notes" | "checkIn" | "checkOut">>) => void;
  removeHotel: (hotelId: string) => void;

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
  days: [
    { id: 1, label: "Day 1", sublabel: "", color: DAY_COLORS[0], pins: [] },
  ],
};

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      trips: [defaultTrip],
      activeTripId: 1,
      activeDayId: 1,
      selectedPinId: null,
      radiusCenter: null,
      discoverOpen: false,
      discoverTab: "eat",
      sidebarCollapsed: false,
      sidebarWidth: 310,
      darkMode: false,
      newTripModalOpen: false,

      setActiveTripId: (id) => set({ activeTripId: id, activeDayId: get().trips.find(t => t.id === id)!.days[0]?.id ?? 1 }),
      setActiveDayId: (id) => set({ activeDayId: id }),
      setSelectedPinId: (id) => set({ selectedPinId: id }),
      setRadiusCenter: (center) => set({ radiusCenter: center }),

      toggleDiscover: (tab) =>
        set((s) => {
          if (s.discoverOpen && tab && s.discoverTab === tab) return { discoverOpen: false };
          return { discoverOpen: true, discoverTab: tab ?? s.discoverTab };
        }),
      closeDiscover: () => set({ discoverOpen: false }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarWidth: (w) => set({ sidebarWidth: Math.max(280, Math.min(500, w)) }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setNewTripModalOpen: (open) => set({ newTripModalOpen: open }),

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
          days: [{ id: genId(), label: "Day 1", sublabel: "", color: DAY_COLORS[0], pins: [] }],
        };
        set((s) => ({ trips: [...s.trips, trip], activeTripId: id, activeDayId: trip.days[0].id }));
      },

      updateTrip: (tripId, updates) =>
        set((s) => ({
          trips: s.trips.map((t) => (t.id === tripId ? { ...t, ...updates } : t)),
        })),

      removeTrip: (tripId) =>
        set((s) => {
          const remaining = s.trips.filter((t) => t.id !== tripId);
          if (remaining.length === 0) return s; // don't delete the last trip
          const newActiveId = s.activeTripId === tripId ? remaining[0].id : s.activeTripId;
          const newActiveTrip = remaining.find((t) => t.id === newActiveId)!;
          return {
            trips: remaining,
            activeTripId: newActiveId,
            activeDayId: newActiveTrip.days[0]?.id ?? 1,
          };
        }),

      addDay: () =>
        set((s) => {
          const trip = s.trips.find((t) => t.id === s.activeTripId)!;
          const dayIndex = trip.days.length;
          const newDay: Day = {
            id: genId(),
            label: `Day ${dayIndex + 1}`,
            sublabel: "",
            color: DAY_COLORS[dayIndex % DAY_COLORS.length],
            pins: [],
          };
          return {
            trips: s.trips.map((t) => (t.id === s.activeTripId ? { ...t, days: [...t.days, newDay] } : t)),
            activeDayId: newDay.id,
          };
        }),

      removeDay: (dayId) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === s.activeTripId ? { ...t, days: t.days.filter((d) => d.id !== dayId) } : t
          ),
          activeDayId: s.activeDayId === dayId ? s.trips.find((t) => t.id === s.activeTripId)!.days[0]?.id ?? 1 : s.activeDayId,
        })),

      updateDay: (dayId, updates) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === s.activeTripId
              ? { ...t, days: t.days.map((d) => (d.id === dayId ? { ...d, ...updates } : d)) }
              : t
          ),
        })),

      addPin: (dayId, pin) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === s.activeTripId
              ? { ...t, days: t.days.map((d) => (d.id === dayId ? { ...d, pins: [...d.pins, { pinType: "location", ...pin, id: genId() }] } : d)) }
              : t
          ),
        })),

      updatePin: (dayId, pinId, updates) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === s.activeTripId
              ? { ...t, days: t.days.map((d) => (d.id === dayId ? { ...d, pins: d.pins.map((p) => (p.id === pinId ? { ...p, ...updates } : p)) } : d)) }
              : t
          ),
        })),

      removePin: (dayId, pinId) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === s.activeTripId
              ? { ...t, days: t.days.map((d) => (d.id === dayId ? { ...d, pins: d.pins.filter((p) => p.id !== pinId) } : d)) }
              : t
          ),
          selectedPinId: s.selectedPinId === pinId ? null : s.selectedPinId,
        })),

      reorderPin: (dayId, fromIndex, toIndex) =>
        set((s) => ({
          trips: s.trips.map((t) => {
            if (t.id !== s.activeTripId) return t;
            return {
              ...t,
              days: t.days.map((d) => {
                if (d.id !== dayId) return d;
                const pins = [...d.pins];
                const [moved] = pins.splice(fromIndex, 1);
                pins.splice(toIndex, 0, moved);
                return { ...d, pins };
              }),
            };
          }),
        })),

      addHotel: (hotel) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === s.activeTripId
              ? { ...t, hotels: [...t.hotels, { notes: null, checkIn: null, checkOut: null, ...hotel, id: `hotel-${genId()}` }] }
              : t
          ),
        })),

      updateHotel: (hotelId, updates) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === s.activeTripId
              ? { ...t, hotels: t.hotels.map((h) => (h.id === hotelId ? { ...h, ...updates } : h)) }
              : t
          ),
        })),

      removeHotel: (hotelId) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === s.activeTripId
              ? { ...t, hotels: t.hotels.filter((h) => h.id !== hotelId) }
              : t
          ),
        })),

      getActiveTrip: () => {
        const s = get();
        return s.trips.find((t) => t.id === s.activeTripId)!;
      },

      getActiveDay: () => {
        const s = get();
        const trip = s.trips.find((t) => t.id === s.activeTripId)!;
        return trip.days.find((d) => d.id === s.activeDayId)!;
      },
    }),
    {
      name: "wander-trips",
      version: 6,
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
