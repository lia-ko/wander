"use client";

import { useState, useMemo, useRef } from "react";
import { useTripStore } from "@/store/tripStore";
import { useUIStore } from "@/store/uiStore";
import { parseTimeToMinutes, minutesToDisplay, parseDurationToMinutes, checkTimeConflict, getDayDate, formatDayDate } from "@/lib/hours";
import { fmtAmt, fmtMins } from "@/lib/formatUtils";
import { STOP_DRAG_TYPE, parseDragData, hasDragType } from "../stops/types";
import type { StopDragData } from "../stops/types";
import StopCell from "./StopCell";
import type { Day } from "@/types";

export default function DayColumn({
  day,
  dayIndex,
  startDate,
  isActive,
  daySpend,
  dayBudgetWarning,
  homeSymbol,
  dark,
  fill,
}: {
  day: Day;
  dayIndex: number;
  startDate: string | null;
  isActive: boolean;
  daySpend: number;
  dayBudgetWarning: boolean;
  homeSymbol: string;
  dark: boolean;
  fill: boolean;
}) {
  const setActiveDayId = useTripStore((s) => s.setActiveDayId);
  const reorderPin = useTripStore((s) => s.reorderPin);
  const movePinToDay = useTripStore((s) => s.movePinToDay);
  const setSelectedPinId = useUIStore((s) => s.setSelectedPinId);
  const selectedPinId = useUIStore((s) => s.selectedPinId);

  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragOverIdxRef = useRef<number | null>(null);
  dragOverIdxRef.current = dragOverIdx;

  const dayDate = startDate ? getDayDate(startDate, dayIndex) : null;

  // Track original indices so we can map visual position back to store position
  const sortedPins = useMemo(() => {
    const withIdx = day.pins.map((p, origIdx) => ({
      pin: p, origIdx, mins: parseTimeToMinutes(p.startTime),
    }));
    const timed = withIdx.filter((e) => e.mins !== null).sort((a, b) => a.mins! - b.mins!);
    const untimed = withIdx.filter((e) => e.mins === null);
    return [...timed, ...untimed];
  }, [day.pins]);

  const handleDragStart = (e: React.DragEvent, visualIdx: number) => {
    const entry = sortedPins[visualIdx];
    e.dataTransfer.setData(STOP_DRAG_TYPE, JSON.stringify({
      pinId: entry.pin.id,
      fromDayId: day.id,
      fromOrigIdx: entry.origIdx,
    }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, visualIdx: number) => {
    if (hasDragType(e, STOP_DRAG_TYPE)) {
      e.preventDefault();
      setDragOverIdx(visualIdx);
    }
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    const dropIdx = dragOverIdxRef.current;
    setDragOverIdx(null);
    const data = parseDragData<StopDragData>(e, STOP_DRAG_TYPE);
    if (!data) return;
    e.preventDefault();
    if (data.fromDayId !== day.id) {
      movePinToDay(data.fromDayId, data.pinId, day.id);
      return;
    }
    if (dropIdx === null) return;
    const toOrigIdx = sortedPins[dropIdx]?.origIdx;
    if (toOrigIdx === undefined || data.fromOrigIdx === toOrigIdx) return;
    reorderPin(day.id, data.fromOrigIdx!, toOrigIdx);
  };

  const handleDragEnd = () => {
    setDragOverIdx(null);
  };

  const hasConflicts = sortedPins.some((e) => {
    if (e.mins === null) return false;
    return checkTimeConflict(e.mins, e.pin.openingHours, dayDate) === "closed";
  });

  return (
    <div
      className={`flex flex-col border-r ${
        dark ? "border-white/5" : "border-black/5"
      } ${isActive ? dark ? "bg-white/[.03]" : "bg-zinc-50/80" : ""} ${
        fill ? "flex-1 min-w-0" : "flex-shrink-0"
      }`}
      style={fill ? undefined : { minWidth: Math.max(120, sortedPins.length * 96 + 24) }}
      onDrop={handleContainerDrop}
      onDragOver={(e) => { if (hasDragType(e, STOP_DRAG_TYPE)) e.preventDefault(); }}
      onDragEnd={handleDragEnd}
      onDragLeave={() => setDragOverIdx(null)}
    >
      {/* Day header */}
      <button
        onClick={() => setActiveDayId(day.id)}
        className={`flex items-center gap-1.5 px-3 py-1 text-left transition-colors ${
          dark ? "hover:bg-white/5" : "hover:bg-zinc-50"
        }`}
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: day.color }} />
        <span className={`text-[10px] font-bold ${
          isActive ? dark ? "text-zinc-100" : "text-zinc-800" : dark ? "text-zinc-500" : "text-zinc-400"
        }`}>
          {day.label}
        </span>
        {dayDate && (
          <span className={`text-[9px] ${dark ? "text-zinc-600" : "text-zinc-400"}`}>
            {formatDayDate(dayDate)}
          </span>
        )}
        <span className={`text-[9px] ${dark ? "text-zinc-600" : "text-zinc-400"}`}>
          {day.pins.length} stop{day.pins.length !== 1 ? "s" : ""}
        </span>
        {hasConflicts && (
          <span className="text-[8px] text-red-400 font-semibold ml-auto flex items-center gap-0.5" title="Schedule conflict with opening hours">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            hours
          </span>
        )}
        {dayBudgetWarning && !hasConflicts && (
          <span className="text-[8px] text-amber-400 font-semibold ml-auto">
            {homeSymbol}{fmtAmt(daySpend, 0)}
          </span>
        )}
      </button>

      {/* Stops */}
      <div className={`flex items-end px-2 pb-1.5 ${fill ? "gap-1.5" : "gap-1 overflow-x-auto scrollbar-hide"}`}>
        {sortedPins.length === 0 && (
          <span className={`text-[9px] px-2 py-1 ${dark ? "text-zinc-700" : "text-zinc-300"}`}>
            No stops
          </span>
        )}
        {sortedPins.map((entry, i) => {
          const timeMins = parseTimeToMinutes(entry.pin.startTime);
          const durationMins = parseDurationToMinutes(entry.pin.duration);
          const endMins = timeMins !== null && durationMins ? timeMins + durationMins : null;
          const conflict = timeMins !== null ? checkTimeConflict(timeMins, entry.pin.openingHours, dayDate) : null;
          const isClosed = conflict === "closed";

          return (
            <div key={entry.pin.id} className={`flex flex-col ${fill ? "flex-1 min-w-0" : ""}`}>
              {/* Time label above card */}
              <div className={`flex items-center gap-1 px-0.5 mb-0.5 ${fill ? "" : "justify-center"}`}>
                {timeMins !== null ? (
                  <>
                    <span className={`text-[9px] font-bold ${
                      isClosed ? "text-red-400" : dark ? "text-[#DAA520]" : "text-[#4E8098]"
                    }`}>
                      {minutesToDisplay(timeMins)}
                      {endMins !== null && ` - ${minutesToDisplay(endMins)}`}
                    </span>
                    {durationMins && (
                      <span className={`text-[8px] ${dark ? "text-zinc-600" : "text-zinc-400"}`}>
                        ({fmtMins(durationMins)})
                      </span>
                    )}
                    {isClosed && (
                      <span className="text-[8px] text-red-400 font-semibold">closed</span>
                    )}
                  </>
                ) : (
                  <span className={`text-[8px] ${dark ? "text-zinc-700" : "text-zinc-300"}`}>no time set</span>
                )}
              </div>
              {/* Card */}
              <div className="h-[44px] flex items-stretch">
                {i > 0 && !fill && (
                  <div className="w-1.5 h-px flex-shrink-0 self-center" style={{ backgroundColor: `${day.color}30` }} />
                )}
                <StopCell
                  pin={entry.pin}
                  dayColor={day.color}
                  dayDate={dayDate}
                  stopIndex={i}
                  stopCount={sortedPins.length}
                  isSelected={selectedPinId === entry.pin.id}
                  isDragOver={dragOverIdx === i}
                  onClick={() => {
                    setActiveDayId(day.id);
                    setSelectedPinId(selectedPinId === entry.pin.id ? null : entry.pin.id);
                  }}
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={() => setDragOverIdx(i)}
                  fill={fill}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
