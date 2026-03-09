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

function getGoogleMapsUrl(from: Pin, to: Pin, mode: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.y},${from.x}&destination=${to.y},${to.x}&travelmode=${mode}`;
}

function TransportSegment({ pin, prevPin, dayId }: { pin: Pin; prevPin: Pin; dayId: number }) {
  const updatePin = useTripStore((s) => s.updatePin);
  const dark = useTripStore((s) => s.darkMode);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(pin.travelTime || "");
  const hasCoords = prevPin.y !== 0 && prevPin.x !== 0 && pin.y !== 0 && pin.x !== 0;

  const modes = [
    { key: "walk" as TransportKey, gMapsMode: "walking", emoji: "\u{1F6B6}", label: "Walk", color: "#6B7280" },
    { key: "transit" as TransportKey, gMapsMode: "transit", emoji: "\u{1F687}", label: "Transit", color: "#3B82F6" },
    { key: "car" as TransportKey, gMapsMode: "driving", emoji: "\u{1F697}", label: "Drive", color: "#EF4444" },
  ];

  const handleSelect = (key: TransportKey) => {
    updatePin(dayId, pin.id, { transport: key });
  };

  return (
    <div className="mx-2 my-1">
      {/* Dashed connector */}
      <div className="ml-3 mb-1">
        <div className={`w-px h-3 border-l border-dashed ${dark ? "border-[#F5E8D8]/20" : "border-[#4E8098]/15"}`} style={{ marginLeft: "8px" }} />
      </div>

      {/* Transport options — each is a Google Maps link */}
      <div className={`rounded-xl overflow-hidden ${dark ? "bg-[#F5E8D8]/6" : "bg-[#F0D5A8]/15"}`}>
        <div className={`px-3 py-1.5 text-[10px] font-medium ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
          {prevPin.name} &rarr; {pin.name}
        </div>
        <div className="flex items-center gap-1 px-2 pb-1.5">
          {modes.map((mode) => {
            const isActive = pin.transport === mode.key;
            if (!hasCoords) {
              return (
                <button
                  key={mode.key}
                  onClick={() => handleSelect(mode.key)}
                  className={`flex items-center gap-1.5 flex-1 justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all ${
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
            }
            return (
              <a
                key={mode.key}
                href={getGoogleMapsUrl(prevPin, pin, mode.gMapsMode)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSelect(mode.key)}
                className={`flex items-center gap-1.5 flex-1 justify-center px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "text-white shadow-sm"
                    : dark ? "text-zinc-400 hover:bg-[#F5E8D8]/10" : "text-zinc-500 hover:bg-[#4E8098]/8"
                }`}
                style={isActive ? { backgroundColor: mode.color } : undefined}
              >
                <span>{mode.emoji}</span>
                <span>{mode.label}</span>
                <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            );
          })}
        </div>
        {/* Travel note */}
        <div className="px-2 pb-2">
          {editingNote ? (
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updatePin(dayId, pin.id, { travelTime: noteText.trim() || null });
                  setEditingNote(false);
                }
                if (e.key === "Escape") { setNoteText(pin.travelTime || ""); setEditingNote(false); }
              }}
              onBlur={() => {
                updatePin(dayId, pin.id, { travelTime: noteText.trim() || null });
                setEditingNote(false);
              }}
              autoFocus
              className={`w-full px-2 py-1 rounded-lg text-xs outline-none ${dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8] placeholder:text-zinc-500" : "bg-[#4E8098]/8 text-zinc-900 placeholder:text-zinc-400"}`}
              placeholder="e.g. 20 min walk, Line 1 subway 15 min"
            />
          ) : (
            <button
              onClick={() => { setNoteText(pin.travelTime || ""); setEditingNote(true); }}
              className={`w-full text-left px-2 py-1 rounded-lg text-xs transition-colors ${
                pin.travelTime
                  ? dark ? "text-zinc-300" : "text-zinc-600"
                  : dark ? "text-zinc-600 hover:bg-[#F5E8D8]/6" : "text-zinc-400 hover:bg-[#F0D5A8]/25"
              }`}
            >
              {pin.travelTime || "+ Add note"}
            </button>
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

function AddStopSearch({ dayId, dayColor }: { dayId: number; dayColor: string }) {
  const [open, setOpen] = useState(false);
  const addPin = useTripStore((s) => s.addPin);
  const dark = useTripStore((s) => s.darkMode);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 w-full mx-2 mt-1 px-3 py-2.5 rounded-xl text-sm transition-colors ${
          dark ? "text-zinc-400 hover:bg-[#F5E8D8]/6" : "text-zinc-400 hover:bg-[#F0D5A8]/25"
        }`}
      >
        <span className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center text-xs"
          style={{ borderColor: dayColor, color: dayColor }}>+</span>
        <span>Add a stop</span>
      </button>
    );
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
        setOpen(false);
      }}
      onCancel={() => setOpen(false)}
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
      {day.pins.map((pin, i) => (
        <div key={pin.id}>
          {i > 0 && <TransportSegment pin={pin} prevPin={day.pins[i - 1]} dayId={day.id} />}
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
        </div>
      ))}

      {day.pins.length === 0 && (
        <div className={`text-center py-8 text-sm ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
          No stops yet. Add a stop below or drop a pin on the map.
        </div>
      )}

      <AddStopSearch dayId={day.id} dayColor={day.color} />
    </div>
  );
}
