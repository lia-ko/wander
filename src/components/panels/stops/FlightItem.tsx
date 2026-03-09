"use client";

import { useState } from "react";
import { useTripStore } from "@/store/tripStore";
import { textMuted, textSubtle, sectionBg, inputBase, btnHover, dragOverBg } from "@/lib/styles";
import type { Pin } from "@/types";
import type { DragHandlers } from "./types";

export default function FlightItem({ pin, index, dayId, onDragStart, onDragOver, onDrop, isDragOver }: {
  pin: Pin; index: number; dayId: number; dayColor: string;
  isDragOver: boolean;
} & DragHandlers) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const removePin = useTripStore((s) => s.removePin);
  const updatePin = useTripStore((s) => s.updatePin);
  const movePinToWishlist = useTripStore((s) => s.movePinToWishlist);
  const dark = useTripStore((s) => s.darkMode);

  const [airline, setAirline] = useState(pin.airline || "");
  const [flightNum, setFlightNum] = useState(pin.flightNumber || "");
  const [depAirport, setDepAirport] = useState(pin.departureAirport || "");
  const [arrAirport, setArrAirport] = useState(pin.arrivalAirport || "");
  const [depTime, setDepTime] = useState(pin.departureTime || "");
  const [arrTime, setArrTime] = useState(pin.arrivalTime || "");

  const handleSave = () => {
    updatePin(dayId, pin.id, {
      airline: airline.trim() || undefined,
      flightNumber: flightNum.trim() || undefined,
      departureAirport: depAirport.trim() || undefined,
      arrivalAirport: arrAirport.trim() || undefined,
      departureTime: depTime.trim() || undefined,
      arrivalTime: arrTime.trim() || undefined,
      name: `${airline.trim()} ${flightNum.trim()}`.trim() || "Flight",
    });
    setEditing(false);
  };

  const inputCls = `w-full px-2 py-1.5 rounded-lg text-xs outline-none ${
    inputBase(dark)
  }`;

  if (editing) {
    return (
      <div className={`px-3 py-2 rounded-xl mx-2 ${sectionBg(dark)}`}>
        <div className="flex gap-2 mb-1.5">
          <input type="text" value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Airline" aria-label="Airline" className={inputCls} />
          <input type="text" value={flightNum} onChange={(e) => setFlightNum(e.target.value)} placeholder="Flight #" aria-label="Flight number" className={inputCls} />
        </div>
        <div className="flex gap-2 mb-1.5">
          <input type="text" value={depAirport} onChange={(e) => setDepAirport(e.target.value)} placeholder="From (e.g. JFK)" aria-label="Departure airport" className={inputCls} />
          <input type="text" value={arrAirport} onChange={(e) => setArrAirport(e.target.value)} placeholder="To (e.g. MAD)" aria-label="Arrival airport" className={inputCls} />
        </div>
        <div className="flex gap-2 mb-2">
          <input type="text" value={depTime} onChange={(e) => setDepTime(e.target.value)} placeholder="Departs (e.g. 10:30 AM)" aria-label="Departure time" className={inputCls} />
          <input type="text" value={arrTime} onChange={(e) => setArrTime(e.target.value)} placeholder="Arrives (e.g. 11:45 PM)" aria-label="Arrival time" className={inputCls} />
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleSave} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#4E8098] hover:bg-[#3D6B80] transition-colors">Save</button>
          <button onClick={() => setEditing(false)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${dark ? "bg-[#F5E8D8]/10 hover:bg-[#F5E8D8]/15" : "bg-zinc-200 hover:bg-zinc-300"}`}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      role="listitem"
      aria-roledescription="Draggable flight"
      aria-label={pin.airline && pin.flightNumber ? `${pin.airline} ${pin.flightNumber}` : "Flight"}
      className={`group px-3 py-2 rounded-xl mx-2 transition-colors cursor-grab active:cursor-grabbing ${
        isDragOver
          ? dragOverBg(dark)
          : dark ? "bg-[#3B82F6]/10 hover:bg-[#3B82F6]/15" : "bg-[#3B82F6]/8 hover:bg-[#3B82F6]/12"
      }`}
      style={{ border: isDragOver ? undefined : "1px solid rgba(59,130,246,0.2)" }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-full bg-[#3B82F6] flex items-center justify-center text-xs text-white">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {pin.airline && pin.flightNumber ? `${pin.airline} ${pin.flightNumber}` : "Flight"}
          </div>
          <div className={`text-xs ${textMuted(dark)}`}>
            {pin.departureAirport && pin.arrivalAirport
              ? `${pin.departureAirport} \u2192 ${pin.arrivalAirport}`
              : "No route set"}
          </div>
          {(pin.departureTime || pin.arrivalTime) && (
            <div className={`text-[10px] mt-0.5 ${textSubtle(dark)}`}>
              {pin.departureTime && `Dep: ${pin.departureTime}`}
              {pin.departureTime && pin.arrivalTime && " \u00B7 "}
              {pin.arrivalTime && `Arr: ${pin.arrivalTime}`}
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="flex items-center gap-1 mt-2 ml-8" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setEditing(true)}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
              btnHover(dark)
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => movePinToWishlist(dayId, pin.id)}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
              dark ? "bg-[#DAA520]/10 text-[#DAA520] hover:bg-[#DAA520]/20" : "bg-[#4E8098]/8 text-[#4E8098] hover:bg-[#4E8098]/15"
            }`}
            title="Move to wishlist"
          >
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save
            </span>
          </button>
          <button
            onClick={() => removePin(dayId, pin.id)}
            className="text-xs px-2.5 py-1 rounded-md text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
