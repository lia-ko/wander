"use client";

import { useState } from "react";
import { useTripStore } from "@/store/tripStore";
import { getDayDate, formatDayDate } from "@/lib/hours";

export default function DayTitleBar() {
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const updateDay = useTripStore((s) => s.updateDay);
  const updateTrip = useTripStore((s) => s.updateTrip);
  const removeDay = useTripStore((s) => s.removeDay);
  const dark = useTripStore((s) => s.darkMode);
  const [editingSublabel, setEditingSublabel] = useState(false);
  const [sublabelValue, setSublabelValue] = useState("");
  const [editingDate, setEditingDate] = useState(false);

  const day = trip.days.find((d) => d.id === activeDayId);
  if (!day) return null;

  const dayIndex = trip.days.findIndex((d) => d.id === activeDayId);
  const dayDate = trip.startDate ? getDayDate(trip.startDate, dayIndex) : null;

  const handleSaveSublabel = () => {
    updateDay(day.id, { sublabel: sublabelValue.trim() });
    setEditingSublabel(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTrip(trip.id, { startDate: e.target.value || null });
    setEditingDate(false);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: day.color }} />
        <span className="font-semibold text-sm">{day.label}</span>
        {/* Day date */}
        {editingDate ? (
          <input
            type="date"
            defaultValue={trip.startDate || ""}
            onChange={handleDateChange}
            onBlur={() => setEditingDate(false)}
            autoFocus
            className={`text-xs px-1.5 py-0.5 rounded outline-none ${
              dark ? "bg-white/10 text-white" : "bg-black/5 text-zinc-900"
            }`}
          />
        ) : dayDate ? (
          <span
            className={`text-xs cursor-pointer ${dark ? "text-zinc-400 hover:text-zinc-300" : "text-zinc-500 hover:text-zinc-700"}`}
            onClick={() => setEditingDate(true)}
            title="Click to change start date"
          >
            {formatDayDate(dayDate)}
          </span>
        ) : (
          <span
            className={`text-xs cursor-pointer ${dark ? "text-zinc-500 hover:text-zinc-400" : "text-zinc-400 hover:text-zinc-600"}`}
            onClick={() => setEditingDate(true)}
            title="Set trip start date"
          >
            + date
          </span>
        )}
        {/* Sublabel */}
        {editingSublabel ? (
          <input
            type="text"
            value={sublabelValue}
            onChange={(e) => setSublabelValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveSublabel(); if (e.key === "Escape") setEditingSublabel(false); }}
            onBlur={handleSaveSublabel}
            autoFocus
            placeholder="Neighbourhood..."
            className={`text-xs px-1.5 py-0.5 rounded outline-none w-24 ${
              dark ? "bg-white/10 text-white" : "bg-black/5 text-zinc-900"
            }`}
          />
        ) : (
          <span
            className={`text-xs cursor-pointer ${dark ? "text-zinc-400 hover:text-zinc-300" : "text-zinc-500 hover:text-zinc-700"}`}
            onClick={() => { setSublabelValue(day.sublabel); setEditingSublabel(true); }}
            title="Click to edit neighbourhood"
          >
            {day.sublabel ? `\u00B7 ${day.sublabel}` : "+ area"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-medium ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
          {day.pins.length} {day.pins.length === 1 ? "stop" : "stops"}
        </span>
        {trip.days.length > 1 && (
          <button
            onClick={() => removeDay(day.id)}
            className={`text-xs p-1 rounded transition-colors ${dark ? "text-zinc-500 hover:text-red-400 hover:bg-white/5" : "text-zinc-400 hover:text-red-500 hover:bg-black/5"}`}
            title="Remove this day"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
