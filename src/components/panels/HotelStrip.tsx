"use client";

import { useTripStore } from "@/store/tripStore";
import { HOTEL_COLOR } from "@/store/constants";

export default function HotelStrip() {
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const dark = useTripStore((s) => s.darkMode);

  if (!trip.hotel) return null;

  return (
    <div
      className="mx-3 mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2.5"
      style={{
        backgroundColor: dark ? `${HOTEL_COLOR}20` : `${HOTEL_COLOR}15`,
        border: `1px solid ${HOTEL_COLOR}40`,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
        style={{ backgroundColor: HOTEL_COLOR }}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{trip.hotel.name}</div>
        <div className={`text-xs truncate ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{trip.hotel.address}</div>
      </div>
    </div>
  );
}
