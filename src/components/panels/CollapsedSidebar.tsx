"use client";

import { useTripStore } from "@/store/tripStore";
import { hoverBg } from "@/lib/styles";
import GlassPanel from "@/components/ui/GlassPanel";

export default function CollapsedSidebar() {
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const toggleSidebar = useTripStore((s) => s.toggleSidebar);
  const toggleDiscover = useTripStore((s) => s.toggleDiscover);
  const dark = useTripStore((s) => s.darkMode);

  return (
    <GlassPanel className="absolute top-4 left-4 bottom-4 w-[52px] z-20 flex flex-col items-center py-3 gap-3">
      <button
        onClick={toggleSidebar}
        className={`text-lg transition-colors ${hoverBg(dark)} w-9 h-9 rounded-xl flex items-center justify-center`}
        title={trip.name}
      >
        {trip.emoji}
      </button>

      <div className="flex flex-col items-center gap-1.5">
        {trip.days.map((day) => (
          <div
            key={day.id}
            className="w-3 h-3 rounded-full cursor-pointer transition-transform hover:scale-125"
            style={{ backgroundColor: day.color }}
            onClick={toggleSidebar}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          onClick={() => { toggleSidebar(); toggleDiscover("eat"); }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors ${
            hoverBg(dark)
          }`}
          title="Eat Out"
        >
          {"\u{1F37D}\uFE0F"}
        </button>
        <button
          onClick={() => { toggleSidebar(); toggleDiscover("grocers"); }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors ${
            hoverBg(dark)
          }`}
          title="Grocers"
        >
          {"\u{1F6D2}"}
        </button>
        <button
          onClick={() => { toggleSidebar(); toggleDiscover("attractions"); }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors ${
            hoverBg(dark)
          }`}
          title="Attractions"
        >
          {"\u{1F5FA}\uFE0F"}
        </button>
      </div>
    </GlassPanel>
  );
}
