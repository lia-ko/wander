"use client";

import { parseTimeToMinutes, minutesToDisplay, checkTimeConflict } from "@/lib/hours";
import type { Pin } from "@/types";

/** Convert a hex color to HSL components. */
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

/** Build a vivid gradient background for a stop card based on its position in the day. */
function stopGradient(dayColor: string, index: number, count: number): string {
  const [h] = hexToHsl(dayColor);
  const spread = 30;
  const t = count > 1 ? index / (count - 1) : 0.5;
  const hue = h - spread + t * spread * 2;
  const from = `hsl(${hue}, 80%, 50%)`;
  const to = `hsl(${hue + 20}, 85%, 38%)`;
  return `linear-gradient(135deg, ${from}, ${to})`;
}

export default function StopCell({
  pin,
  dayDate,
  dayColor,
  stopIndex,
  stopCount,
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
  stopIndex: number;
  stopCount: number;
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
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{ background: stopGradient(dayColor, stopIndex, stopCount) }}
      />

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
