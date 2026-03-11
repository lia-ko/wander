"use client";

import { useMemo } from "react";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { getDayDate, parseTimeToMinutes, parseDurationToMinutes, minutesToDisplay, checkTimeConflict } from "@/lib/hours";
import { fmtMins } from "@/lib/formatUtils";
import { textSubtle, textStrong } from "@/lib/styles";
import type { Pin } from "@/types";

/** Build a timeline from pins that have startTime set, computing gaps and conflicts. */
function buildTimeline(
  pins: Pin[],
  dayDate: Date | null,
): Array<{
  pin: Pin;
  index: number;
  startMins: number;
  endMins: number | null;
  conflict: "open" | "closed" | null;
}> {
  const entries: Array<{
    pin: Pin;
    index: number;
    startMins: number;
    endMins: number | null;
    conflict: "open" | "closed" | null;
  }> = [];

  for (let i = 0; i < pins.length; i++) {
    const pin = pins[i];
    const startMins = parseTimeToMinutes(pin.startTime);
    if (startMins === null) continue;

    // Estimate end time from duration if available
    const durationMins = parseDurationToMinutes(pin.duration);
    const endMins = durationMins ? startMins + durationMins : null;

    const conflict = checkTimeConflict(startMins, pin.openingHours, dayDate);

    entries.push({ pin, index: i, startMins, endMins, conflict });
  }

  // Sort by start time
  entries.sort((a, b) => a.startMins - b.startMins);
  return entries;
}

export default function TimelineSummary({ dayId }: { dayId: number }) {
  const trip = useTripStore(selectActiveTrip);
  const dark = useTripStore((s) => s.darkMode);

  const day = trip.days.find((d) => d.id === dayId);
  if (!day) return null;

  const dayIndex = trip.days.findIndex((d) => d.id === dayId);
  const dayDate = trip.startDate ? getDayDate(trip.startDate, dayIndex) : null;

  const timeline = useMemo(
    () => buildTimeline(day.pins, dayDate),
    [day.pins, dayDate],
  );

  // Don't show if no pins have times set
  if (timeline.length === 0) return null;

  const hasConflicts = timeline.some((e) => e.conflict === "closed");

  return (
    <div className={`mx-3 mb-1 px-2.5 py-2 rounded-xl ${dark ? "bg-white/5" : "bg-zinc-50"}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <svg className={`w-3 h-3 ${dark ? "text-[#DAA520]" : "text-[#4E8098]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${textSubtle(dark)}`}>
          Timeline
        </span>
        {hasConflicts && (
          <span className="text-[9px] text-red-400 font-medium ml-auto">has conflicts</span>
        )}
      </div>

      <div className="flex flex-col">
        {timeline.map((entry, i) => {
          const isConflict = entry.conflict === "closed";
          const prevEntry = i > 0 ? timeline[i - 1] : null;

          // Calculate gap from previous entry
          let gapMins: number | null = null;
          if (prevEntry) {
            const prevEnd = prevEntry.endMins ?? prevEntry.startMins;
            gapMins = entry.startMins - prevEnd;
          }

          return (
            <div key={entry.pin.id}>
              {/* Gap indicator */}
              {gapMins !== null && gapMins > 0 && (
                <div className={`flex items-center gap-1.5 pl-1 py-0.5`}>
                  <div className={`w-px h-3 ${dark ? "bg-white/10" : "bg-zinc-200"}`} style={{ marginLeft: "3px" }} />
                  <span className={`text-[9px] ${textSubtle(dark)}`}>
                    {fmtMins(gapMins)}
                  </span>
                </div>
              )}

              {/* Timeline entry */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold w-14 flex-shrink-0 ${
                  isConflict ? "text-red-400" : dark ? "text-[#DAA520]" : "text-[#4E8098]"
                }`}>
                  {minutesToDisplay(entry.startMins)}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isConflict ? "bg-red-400" : dark ? "bg-[#DAA520]" : "bg-[#4E8098]"
                }`} />
                <span className={`text-[10px] truncate ${textStrong(dark)}`}>
                  {entry.pin.name}
                </span>
                {entry.endMins && (
                  <span className={`text-[9px] flex-shrink-0 ${textSubtle(dark)}`}>
                    → {minutesToDisplay(entry.endMins)}
                  </span>
                )}
                {isConflict && (
                  <span title="Outside opening hours">
                    <svg className="w-2.5 h-2.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
