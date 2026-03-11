import type { Pin } from "@/types";
import type { StoreSet, StoreGet } from "../tripStore";
import { genId, getActiveTrip, mapActiveTrip, mapActiveDay, snapBeforeAction } from "../tripStore";
import { useUIStore } from "../uiStore";

export function createPinActions(set: StoreSet, get: StoreGet) {
  return {
    addPin: (dayId: number, pin: Omit<Pin, "id" | "pinType"> & { pinType?: Pin["pinType"] }) =>
      set((s) => ({
        trips: mapActiveDay(s, dayId, (d) => ({ ...d, pins: [...d.pins, { pinType: "location", ...pin, id: genId() }] })),
      })),

    updatePin: (dayId: number, pinId: number, updates: Partial<Pin>) =>
      set((s) => ({
        trips: mapActiveDay(s, dayId, (d) => ({ ...d, pins: d.pins.map((p) => (p.id === pinId ? { ...p, ...updates } : p)) })),
      })),

    removePin: (dayId: number, pinId: number) => {
      const trip = getActiveTrip(get);
      const day = trip?.days.find((d) => d.id === dayId);
      const pinName = day?.pins.find((p) => p.id === pinId)?.name ?? "Stop";
      snapBeforeAction(get, `Removed "${pinName}"`);
      set((s) => ({
        trips: mapActiveDay(s, dayId, (d) => ({ ...d, pins: d.pins.filter((p) => p.id !== pinId) })),
      }));
      const ui = useUIStore.getState();
      if (ui.selectedPinId === pinId) ui.setSelectedPinId(null);
    },

    reorderPin: (dayId: number, fromIndex: number, toIndex: number) => {
      const trip = getActiveTrip(get);
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

    movePinToDay: (fromDayId: number, pinId: number, toDayId: number) => {
      if (fromDayId === toDayId) return;
      const trip = getActiveTrip(get);
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
            if (d.id === toDayId) return { ...d, pins: [...d.pins, { ...pin, transport: null, travelTime: null, startTime: undefined }] };
            return d;
          }),
        })),
      }));
    },

    // ── Wishlist ──

    addToWishlist: (pin: Omit<Pin, "id" | "pinType"> & { pinType?: Pin["pinType"] }) =>
      set((s) => ({
        trips: mapActiveTrip(s, (t) => ({
          ...t, wishlist: [...(t.wishlist ?? []), { pinType: "location", ...pin, id: genId() }],
        })),
      })),

    updateWishlistItem: (pinId: number, updates: Partial<Pin>) =>
      set((s) => ({
        trips: mapActiveTrip(s, (t) => ({
          ...t, wishlist: (t.wishlist ?? []).map((p) => (p.id === pinId ? { ...p, ...updates } : p)),
        })),
      })),

    removeFromWishlist: (pinId: number) => {
      const trip = getActiveTrip(get);
      const pinName = (trip?.wishlist ?? []).find((p) => p.id === pinId)?.name ?? "Item";
      snapBeforeAction(get, `Removed "${pinName}" from wishlist`);
      set((s) => ({
        trips: mapActiveTrip(s, (t) => ({ ...t, wishlist: (t.wishlist ?? []).filter((p) => p.id !== pinId) })),
      }));
    },

    moveWishlistToDay: (pinId: number, dayId: number, insertIndex?: number) => {
      const trip = getActiveTrip(get);
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

    movePinToWishlist: (dayId: number, pinId: number) => {
      const trip = getActiveTrip(get);
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
  };
}
