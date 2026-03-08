"use client";

import { useTripStore } from "@/store/tripStore";

export default function DayChips() {
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const setActiveDayId = useTripStore((s) => s.setActiveDayId);
  const addDay = useTripStore((s) => s.addDay);
  const dark = useTripStore((s) => s.darkMode);

  return (
    <div className="flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto scrollbar-hide">
      {trip.days.map((day) => {
        const isActive = day.id === activeDayId;
        return (
          <button
            key={day.id}
            onClick={() => setActiveDayId(day.id)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: isActive ? day.color : dark ? `${day.color}20` : `${day.color}15`,
              color: isActive ? "white" : day.color,
              border: `1.5px solid ${isActive ? day.color : "transparent"}`,
            }}
          >
            {day.label}
          </button>
        );
      })}
      <button
        onClick={addDay}
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${
          dark ? "text-zinc-400 hover:bg-white/10" : "text-zinc-400 hover:bg-black/5"
        }`}
      >
        +
      </button>
    </div>
  );
}
