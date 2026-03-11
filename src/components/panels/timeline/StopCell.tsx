"use client";

import { parseTimeToMinutes, minutesToDisplay, checkTimeConflict } from "@/lib/hours";
import type { Pin } from "@/types";

export default function StopCell({
  pin,
  dayDate,
  dayColor,
  isSelected,
  isDragOver,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  fill,
}: {
  pin: Pin;
  dayDate: Date | null;
  dayColor: string;
  isSelected: boolean;
  isDragOver: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  fill?: boolean;
}) {
  const timeMins = parseTimeToMinutes(pin.startTime);
  const conflict = timeMins !== null ? checkTimeConflict(timeMins, pin.openingHours, dayDate) : null;
  const isClosed = conflict === "closed";
  const thumb = pin.thumbnail;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      className={`relative overflow-hidden rounded-md transition-all text-left h-full cursor-grab active:cursor-grabbing ${
        fill ? "w-full" : "flex-shrink-0 w-[90px]"
      } ${
        isDragOver ? "ring-2 ring-offset-1 ring-blue-400/80 scale-105" :
        isSelected ? "ring-2 ring-offset-1 ring-white/60" : "hover:brightness-110"
      }`}
      title={pin.name}
    >
      {/* Background image or placeholder */}
      {thumb ? (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${thumb})` }} />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: `${dayColor}18` }}>
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dayColor, opacity: 0.25 }} />
          </div>
        </div>
      )}

      {/* Time badge -- top left */}
      {timeMins !== null && (
        <div className="absolute top-0.5 left-0.5 flex items-center gap-0.5 px-1 py-px rounded-sm bg-black/50 backdrop-blur-sm">
          <span className={`text-[7px] font-bold leading-tight ${isClosed ? "text-red-400" : "text-white"}`}>
            {minutesToDisplay(timeMins)}
          </span>
          {isClosed && (
            <span className="text-[6px] text-red-400 font-bold">!</span>
          )}
        </div>
      )}

      {/* Name overlay -- bottom */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 pt-2 pb-0.5">
        <span className="text-[9px] font-semibold text-white truncate block leading-tight drop-shadow-sm">
          {pin.name}
        </span>
      </div>
    </div>
  );
}
