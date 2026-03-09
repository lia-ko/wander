"use client";

import { useState, useEffect } from "react";
import { useTripStore } from "@/store/tripStore";
import { FOOD_TYPE_META, ATTR_TYPE_META } from "@/store/constants";
import { getHoursForDate, getDayDate, fetchOpeningHours } from "@/lib/hours";
import type { Pin, TransportKey } from "@/types";
import PlaceSearch from "./PlaceSearch";

function StopItem({ pin, index, dayId, dayColor, onDragStart, onDragOver, onDrop, isDragOver }: {
  pin: Pin; index: number; dayId: number; dayColor: string;
  onDragStart: (i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (i: number) => void;
  isDragOver: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(pin.name);
  const [editNote, setEditNote] = useState(pin.note || "");
  const removePin = useTripStore((s) => s.removePin);
  const updatePin = useTripStore((s) => s.updatePin);
  const dark = useTripStore((s) => s.darkMode);
  const setSelectedPinId = useTripStore((s) => s.setSelectedPinId);
  const selectedPinId = useTripStore((s) => s.selectedPinId);
  const radiusCenter = useTripStore((s) => s.radiusCenter);
  const setRadiusCenter = useTripStore((s) => s.setRadiusCenter);
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const day = useTripStore((s) => {
    const tr = s.trips.find((t) => t.id === s.activeTripId)!;
    return tr.days.find((d) => d.id === s.activeDayId)!;
  });
  const isSelected = selectedPinId === pin.id;
  const pinCount = day.pins.length;

  // Compute day-specific hours
  const dayIndex = trip.days.findIndex((d) => d.id === dayId);
  const dayDate = trip.startDate ? getDayDate(trip.startDate, dayIndex) : null;
  const dayHours = pin.openingHours && dayDate ? getHoursForDate(pin.openingHours, dayDate) : null;

  // Fetch opening hours from Overpass if missing and pin has coordinates
  useEffect(() => {
    if (pin.openingHours || pin.openingHours === "" || !pin.y || !pin.x) return;
    let cancelled = false;
    fetchOpeningHours(pin.y, pin.x, pin.name).then((hours) => {
      if (cancelled) return;
      // Store "" to mark "tried but not found" so we don't retry endlessly
      updatePin(dayId, pin.id, { openingHours: hours || "" });
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin.id, pin.openingHours]);

  const getCategoryBadge = () => {
    if (pin.foodType && FOOD_TYPE_META[pin.foodType]) return FOOD_TYPE_META[pin.foodType].emoji;
    if (pin.attrType && ATTR_TYPE_META[pin.attrType]) return ATTR_TYPE_META[pin.attrType].emoji;
    return null;
  };

  const badge = getCategoryBadge();

  const handleSaveEdit = () => {
    if (editName.trim()) {
      updatePin(dayId, pin.id, { name: editName.trim(), note: editNote.trim() || null });
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={`px-3 py-2 rounded-xl mx-2 ${dark ? "bg-[#F5E8D8]/10" : "bg-[#4E8098]/8"}`}>
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
          className={`w-full px-2 py-1.5 rounded-lg text-sm outline-none mb-1.5 ${
            dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8]" : "bg-white text-zinc-900"
          }`}
          placeholder="Stop name"
        />
        <input
          type="text"
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEditing(false); }}
          className={`w-full px-2 py-1.5 rounded-lg text-sm outline-none mb-2 ${
            dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8]" : "bg-white text-zinc-900"
          }`}
          placeholder="Note (optional)"
        />
        <div className="flex gap-1.5">
          <button onClick={handleSaveEdit} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#4E8098] hover:bg-[#3D6B80] transition-colors">Save</button>
          <button onClick={() => setEditing(false)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${dark ? "bg-[#F5E8D8]/10 hover:bg-[#F5E8D8]/15" : "bg-zinc-200 hover:bg-zinc-300"}`}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      className={`group px-3 py-2 rounded-xl mx-2 transition-colors cursor-grab active:cursor-grabbing ${
        isDragOver
          ? dark ? "bg-[#F5E8D8]/15 border border-dashed border-[#F5E8D8]/30" : "bg-[#4E8098]/10 border border-dashed border-[#4E8098]/30"
          : isSelected
            ? dark ? "bg-[#F5E8D8]/10" : "bg-[#4E8098]/8"
            : dark ? "hover:bg-[#F5E8D8]/6" : "hover:bg-[#F0D5A8]/25"
      }`}
      onClick={() => { setSelectedPinId(isSelected ? null : pin.id); setExpanded(!expanded); }}
    >
      <div className="flex items-center gap-2.5">
        {badge ? (
          <span className="w-6 h-6 flex items-center justify-center text-sm">{badge}</span>
        ) : (
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: dayColor }}
          >
            {index + 1}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{pin.name}</div>
          {pin.note && (
            <div className={`text-xs truncate ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
              {pin.note}
            </div>
          )}
          {(dayHours || (!dayDate && pin.openingHours && pin.openingHours !== "")) && (
            <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${
              dayHours?.toLowerCase().includes("closed")
                ? "text-red-400"
                : dark ? "text-zinc-500" : "text-zinc-400"
            }`}>
              <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">{dayHours || pin.openingHours}</span>
            </div>
          )}
        </div>
        {pin.rating && (
          <div className="flex items-center gap-0.5 text-xs text-amber-500">
            <span>&#9733;</span>
            <span>{pin.rating}</span>
          </div>
        )}
        {pin.price && (
          <span className={`text-xs font-medium ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
            {pin.price}
          </span>
        )}
      </div>

      {expanded && (
        <div className="flex items-center gap-1 mt-2 ml-8" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setEditName(pin.name); setEditNote(pin.note || ""); setEditing(true); }}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
              dark ? "bg-[#F5E8D8]/10 hover:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 hover:bg-[#4E8098]/12"
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => { removePin(dayId, pin.id); setSelectedPinId(null); }}
            className="text-xs px-2.5 py-1 rounded-md text-red-500 transition-colors bg-red-500/10 hover:bg-red-500/20"
          >
            Remove
          </button>
          {pin.y !== 0 && pin.x !== 0 && (
            <button
              onClick={() => {
                const isActive = radiusCenter && Math.abs(radiusCenter.lat - pin.y) < 0.0001 && Math.abs(radiusCenter.lng - pin.x) < 0.0001;
                setRadiusCenter(isActive ? null : { lat: pin.y, lng: pin.x, label: pin.name });
              }}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                radiusCenter && Math.abs(radiusCenter.lat - pin.y) < 0.0001 && Math.abs(radiusCenter.lng - pin.x) < 0.0001
                  ? "bg-[#4E8098]/20 text-[#4E8098]"
                  : dark ? "bg-[#F5E8D8]/10 hover:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 hover:bg-[#4E8098]/12"
              }`}
              title="Show walking radius"
            >
              Radius
            </button>
          )}
          {pinCount > 1 && (
            <span className={`text-[10px] ml-1 ${dark ? "text-zinc-600" : "text-zinc-400"}`}>
              Drag to reorder
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function FlightItem({ pin, index, dayId, dayColor, onDragStart, onDragOver, onDrop, isDragOver }: {
  pin: Pin; index: number; dayId: number; dayColor: string;
  onDragStart: (i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (i: number) => void;
  isDragOver: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const removePin = useTripStore((s) => s.removePin);
  const updatePin = useTripStore((s) => s.updatePin);
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
    dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8] placeholder:text-zinc-500" : "bg-white text-zinc-900 placeholder:text-zinc-400"
  }`;

  if (editing) {
    return (
      <div className={`px-3 py-2 rounded-xl mx-2 ${dark ? "bg-[#F5E8D8]/10" : "bg-[#4E8098]/8"}`}>
        <div className="flex gap-2 mb-1.5">
          <input type="text" value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Airline" className={inputCls} />
          <input type="text" value={flightNum} onChange={(e) => setFlightNum(e.target.value)} placeholder="Flight #" className={inputCls} />
        </div>
        <div className="flex gap-2 mb-1.5">
          <input type="text" value={depAirport} onChange={(e) => setDepAirport(e.target.value)} placeholder="From (e.g. JFK)" className={inputCls} />
          <input type="text" value={arrAirport} onChange={(e) => setArrAirport(e.target.value)} placeholder="To (e.g. MAD)" className={inputCls} />
        </div>
        <div className="flex gap-2 mb-2">
          <input type="text" value={depTime} onChange={(e) => setDepTime(e.target.value)} placeholder="Departs (e.g. 10:30 AM)" className={inputCls} />
          <input type="text" value={arrTime} onChange={(e) => setArrTime(e.target.value)} placeholder="Arrives (e.g. 11:45 PM)" className={inputCls} />
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
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      className={`group px-3 py-2 rounded-xl mx-2 transition-colors cursor-grab active:cursor-grabbing ${
        isDragOver
          ? dark ? "bg-[#F5E8D8]/15 border border-dashed border-[#F5E8D8]/30" : "bg-[#4E8098]/10 border border-dashed border-[#4E8098]/30"
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
          <div className={`text-xs ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
            {pin.departureAirport && pin.arrivalAirport
              ? `${pin.departureAirport} → ${pin.arrivalAirport}`
              : "No route set"}
          </div>
          {(pin.departureTime || pin.arrivalTime) && (
            <div className={`text-[10px] mt-0.5 ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
              {pin.departureTime && `Dep: ${pin.departureTime}`}
              {pin.departureTime && pin.arrivalTime && " · "}
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
              dark ? "bg-[#F5E8D8]/10 hover:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 hover:bg-[#4E8098]/12"
            }`}
          >
            Edit
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

function getGoogleMapsUrl(from: Pin, to: Pin, mode: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.y},${from.x}&destination=${to.y},${to.x}&travelmode=${mode}`;
}

function TransportSegment({ pin, prevPin, dayId }: { pin: Pin; prevPin: Pin; dayId: number }) {
  const updatePin = useTripStore((s) => s.updatePin);
  const dark = useTripStore((s) => s.darkMode);
  const [editingTime, setEditingTime] = useState(false);
  const [timeText, setTimeText] = useState(pin.travelTime || "");
  const hasCoords = prevPin.y !== 0 && prevPin.x !== 0 && pin.y !== 0 && pin.x !== 0;

  const modes = [
    { key: "walk" as TransportKey, gMapsMode: "walking", emoji: "\u{1F6B6}", label: "Walk", color: "#6B7280" },
    { key: "transit" as TransportKey, gMapsMode: "transit", emoji: "\u{1F687}", label: "Transit", color: "#3B82F6" },
    { key: "car" as TransportKey, gMapsMode: "driving", emoji: "\u{1F697}", label: "Drive", color: "#EF4444" },
  ];

  const activeMode = modes.find((m) => m.key === pin.transport);

  const handleSelect = (key: TransportKey) => {
    updatePin(dayId, pin.id, { transport: key });
  };

  const handleSaveTime = () => {
    updatePin(dayId, pin.id, { travelTime: timeText.trim() || null });
    setEditingTime(false);
  };

  return (
    <div className="mx-2 my-1">
      {/* Dashed connector */}
      <div className="ml-3 mb-1">
        <div className={`w-px h-3 border-l border-dashed ${dark ? "border-[#F5E8D8]/20" : "border-[#4E8098]/15"}`} style={{ marginLeft: "8px" }} />
      </div>

      <div className={`rounded-xl overflow-hidden ${dark ? "bg-[#F5E8D8]/6" : "bg-[#F0D5A8]/15"}`}>
        {/* Mode selector row */}
        <div className="flex items-center gap-1 px-2 pt-2 pb-1.5">
          {modes.map((mode) => {
            const isActive = pin.transport === mode.key;
            return (
              <button
                key={mode.key}
                onClick={() => handleSelect(mode.key)}
                className={`flex items-center gap-1.5 flex-1 justify-center px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "text-white shadow-sm"
                    : dark ? "text-zinc-400 hover:bg-[#F5E8D8]/10" : "text-zinc-500 hover:bg-[#4E8098]/8"
                }`}
                style={isActive ? { backgroundColor: mode.color } : undefined}
              >
                <span>{mode.emoji}</span>
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Travel time + Google Maps link */}
        <div className="flex items-center gap-1.5 px-2 pb-2">
          {editingTime ? (
            <input
              type="text"
              value={timeText}
              onChange={(e) => setTimeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTime();
                if (e.key === "Escape") { setTimeText(pin.travelTime || ""); setEditingTime(false); }
              }}
              onBlur={handleSaveTime}
              autoFocus
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs outline-none ${
                dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8] placeholder:text-zinc-500" : "bg-[#4E8098]/8 text-zinc-900 placeholder:text-zinc-400"
              }`}
              placeholder="e.g. 48 min"
            />
          ) : (
            <button
              onClick={() => { setTimeText(pin.travelTime || ""); setEditingTime(true); }}
              className={`flex-1 flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                pin.travelTime
                  ? dark ? "text-zinc-300" : "text-zinc-600"
                  : dark ? "text-zinc-600 hover:bg-[#F5E8D8]/6" : "text-zinc-400 hover:bg-[#F0D5A8]/25"
              }`}
            >
              <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {pin.travelTime || "Add travel time"}
            </button>
          )}
          {hasCoords && (
            <a
              href={getGoogleMapsUrl(prevPin, pin, activeMode?.gMapsMode || "walking")}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors flex-shrink-0 ${
                dark ? "text-zinc-400 hover:bg-[#F5E8D8]/10" : "text-zinc-500 hover:bg-[#4E8098]/8"
              }`}
              title="Open in Google Maps"
            >
              Maps
              <svg className="w-2.5 h-2.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Dashed connector */}
      <div className="ml-3 mt-1">
        <div className={`w-px h-3 border-l border-dashed ${dark ? "border-[#F5E8D8]/20" : "border-[#4E8098]/15"}`} style={{ marginLeft: "8px" }} />
      </div>
    </div>
  );
}

function FlightForm({ dayId, onDone }: { dayId: number; onDone: () => void }) {
  const addPin = useTripStore((s) => s.addPin);
  const dark = useTripStore((s) => s.darkMode);
  const [airline, setAirline] = useState("");
  const [flightNum, setFlightNum] = useState("");
  const [depAirport, setDepAirport] = useState("");
  const [arrAirport, setArrAirport] = useState("");
  const [depTime, setDepTime] = useState("");
  const [arrTime, setArrTime] = useState("");

  const inputCls = `w-full px-2.5 py-2 rounded-lg text-xs outline-none ${
    dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8] placeholder:text-zinc-500" : "bg-white text-zinc-900 placeholder:text-zinc-400"
  }`;

  const handleAdd = () => {
    addPin(dayId, {
      name: `${airline.trim()} ${flightNum.trim()}`.trim() || "Flight",
      category: "Flight",
      note: null,
      transport: null,
      travelTime: null,
      x: 0,
      y: 0,
      pinType: "flight",
      airline: airline.trim() || undefined,
      flightNumber: flightNum.trim() || undefined,
      departureAirport: depAirport.trim() || undefined,
      arrivalAirport: arrAirport.trim() || undefined,
      departureTime: depTime.trim() || undefined,
      arrivalTime: arrTime.trim() || undefined,
    });
    onDone();
  };

  return (
    <div className={`mx-2 mt-1 rounded-xl overflow-hidden px-3 py-2.5 space-y-1.5 ${dark ? "bg-[#F5E8D8]/10" : "bg-[#4E8098]/8"}`}>
      <div className="flex gap-2">
        <input type="text" value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Airline" autoFocus className={inputCls} />
        <input type="text" value={flightNum} onChange={(e) => setFlightNum(e.target.value)} placeholder="Flight #" className={inputCls} />
      </div>
      <div className="flex gap-2">
        <input type="text" value={depAirport} onChange={(e) => setDepAirport(e.target.value)} placeholder="From (e.g. JFK)" className={inputCls} />
        <input type="text" value={arrAirport} onChange={(e) => setArrAirport(e.target.value)} placeholder="To (e.g. MAD)" className={inputCls} />
      </div>
      <div className="flex gap-2">
        <input type="text" value={depTime} onChange={(e) => setDepTime(e.target.value)} placeholder="Departs (e.g. 10:30 AM)" className={inputCls} />
        <input type="text" value={arrTime} onChange={(e) => setArrTime(e.target.value)} placeholder="Arrives (e.g. 11:45 PM)" className={inputCls} />
      </div>
      <div className="flex gap-1.5 pt-1">
        <button onClick={handleAdd} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors">Add Flight</button>
        <button onClick={onDone} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${dark ? "bg-[#F5E8D8]/10 hover:bg-[#F5E8D8]/15" : "bg-zinc-200 hover:bg-zinc-300"}`}>Cancel</button>
      </div>
    </div>
  );
}

function AddStopSearch({ dayId, dayColor }: { dayId: number; dayColor: string }) {
  const [mode, setMode] = useState<"closed" | "stop" | "flight">("closed");
  const addPin = useTripStore((s) => s.addPin);
  const dark = useTripStore((s) => s.darkMode);

  if (mode === "closed") {
    return (
      <div className="flex items-center gap-1.5 mx-2 mt-1">
        <button
          onClick={() => setMode("stop")}
          className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl text-sm transition-colors ${
            dark ? "text-zinc-400 hover:bg-[#F5E8D8]/6" : "text-zinc-400 hover:bg-[#F0D5A8]/25"
          }`}
        >
          <span className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center text-xs"
            style={{ borderColor: dayColor, color: dayColor }}>+</span>
          <span>Add a stop</span>
        </button>
        <button
          onClick={() => setMode("flight")}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
            dark ? "text-zinc-400 hover:bg-[#3B82F6]/10" : "text-zinc-400 hover:bg-[#3B82F6]/8"
          }`}
        >
          <span className="w-6 h-6 rounded-full border-2 border-dashed border-[#3B82F6] text-[#3B82F6] flex items-center justify-center">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </span>
          <span>Flight</span>
        </button>
      </div>
    );
  }

  if (mode === "flight") {
    return <FlightForm dayId={dayId} onDone={() => setMode("closed")} />;
  }

  return (
    <PlaceSearch
      onAdd={(name, lat, lng, displayName) => {
        const shortAddress = displayName.split(",").slice(1, 3).join(",").trim();
        addPin(dayId, {
          name,
          category: "Custom",
          note: shortAddress || null,
          transport: null,
          travelTime: null,
          x: lng,
          y: lat,
        });
        setMode("closed");
      }}
      onCancel={() => setMode("closed")}
    />
  );
}

export default function StopList() {
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const reorderPin = useTripStore((s) => s.reorderPin);
  const dark = useTripStore((s) => s.darkMode);

  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const day = trip.days.find((d) => d.id === activeDayId);
  if (!day) return null;

  const handleDragStart = (i: number) => setDragFrom(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOver(i);
  };
  const handleDrop = (toIndex: number) => {
    if (dragFrom !== null && dragFrom !== toIndex) {
      reorderPin(day.id, dragFrom, toIndex);
    }
    setDragFrom(null);
    setDragOver(null);
  };

  return (
    <div
      className="flex-1 overflow-y-auto py-1 scrollbar-hide"
      onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
    >
      {day.pins.map((pin, i) => {
        const prev = i > 0 ? day.pins[i - 1] : null;
        const isFlight = pin.pinType === "flight";
        const prevIsFlight = prev?.pinType === "flight";
        const showTransport = i > 0 && !isFlight && !prevIsFlight;

        return (
          <div key={pin.id}>
            {showTransport && <TransportSegment pin={pin} prevPin={prev!} dayId={day.id} />}
            {i > 0 && !showTransport && (
              <div className="ml-5 my-1">
                <div className={`w-px h-4 border-l border-dashed ${dark ? "border-[#F5E8D8]/20" : "border-[#4E8098]/15"}`} style={{ marginLeft: "8px" }} />
              </div>
            )}
            {isFlight ? (
              <FlightItem
                pin={pin}
                index={i}
                dayId={day.id}
                dayColor={day.color}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragOver={dragOver === i && dragFrom !== i}
              />
            ) : (
              <StopItem
                pin={pin}
                index={i}
                dayId={day.id}
                dayColor={day.color}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragOver={dragOver === i && dragFrom !== i}
              />
            )}
          </div>
        );
      })}

      {day.pins.length === 0 && (
        <div className={`text-center py-8 text-sm ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
          No stops yet. Add a stop below or drop a pin on the map.
        </div>
      )}

      <AddStopSearch dayId={day.id} dayColor={day.color} />
    </div>
  );
}
