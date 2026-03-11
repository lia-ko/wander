/**
 * Zustand persist migration: upgrades persisted state from any previous schema version.
 */
export const SCHEMA_VERSION = 8;

export function migratePersistedState(persisted: unknown): Record<string, unknown> {
  const state = persisted as Record<string, unknown>;
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
}
