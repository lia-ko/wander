"use client";

import { getHoursForDate } from "@/lib/hours";
import type { Pin } from "@/types";

export default function PinPopup({ pin, dayDate, label }: { pin: Pin; dayDate: Date | null; label?: string }) {
  const hours = pin.openingHours && dayDate
    ? getHoursForDate(pin.openingHours, dayDate)
    : pin.openingHours || null;
  const isClosed = hours?.toLowerCase().includes("closed");

  return (
    <div style={{ minWidth: 140 }}>
      <div className="text-sm font-semibold">{pin.name}</div>
      {pin.note && <div className="text-xs text-zinc-500 mt-0.5">{pin.note}</div>}
      {label && <div className="text-[10px] text-zinc-400 mt-0.5">{label}</div>}
      {hours && (
        <div className={`text-[10px] mt-1 flex items-center gap-1 ${isClosed ? "text-red-500 font-medium" : "text-zinc-500"}`}>
          <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isClosed ? "Closed today" : hours}
        </div>
      )}
      {pin.startTime && (
        <div className="text-[10px] text-zinc-500 mt-0.5">
          Planned: {pin.startTime}
          {pin.duration && ` (${pin.duration})`}
        </div>
      )}
      {(pin.rating || pin.price) && (
        <div className="flex items-center gap-2 mt-1">
          {pin.rating && (
            <span className="text-[10px] text-amber-500 font-medium">&#9733; {pin.rating}</span>
          )}
          {pin.price && (
            <span className="text-[10px] text-zinc-500">{pin.price}</span>
          )}
        </div>
      )}
    </div>
  );
}
