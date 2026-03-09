"use client";

import { useState, useEffect } from "react";
import { useTripStore } from "@/store/tripStore";
import { FOOD_TYPE_META, ATTR_TYPE_META } from "@/store/constants";
import { getHoursForDate, getDayDate, fetchOpeningHours } from "@/lib/hours";
import { textMuted, textSubtle, sectionBg, softHoverBg, btnHover, dragOverBg } from "@/lib/styles";
import type { Pin } from "@/types";
import type { DragHandlers } from "./types";

export default function StopItem({ pin, index, dayId, dayColor, onDragStart, onDragOver, onDrop, isDragOver }: {
  pin: Pin; index: number; dayId: number; dayColor: string;
  isDragOver: boolean;
} & DragHandlers) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(pin.name);
  const [editNote, setEditNote] = useState(pin.note || "");
  const removePin = useTripStore((s) => s.removePin);
  const updatePin = useTripStore((s) => s.updatePin);
  const movePinToWishlist = useTripStore((s) => s.movePinToWishlist);
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
      updatePin(dayId, pin.id, { openingHours: hours || "" });
    });
    return () => { cancelled = true; };
  }, [pin.id, pin.openingHours, pin.y, pin.x, pin.name, dayId, updatePin]);

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
      <div className={`px-3 py-2 rounded-xl mx-2 ${sectionBg(dark)}`}>
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
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      className={`group px-3 py-2 rounded-xl mx-2 transition-colors cursor-grab active:cursor-grabbing ${
        isDragOver
          ? dragOverBg(dark)
          : isSelected
            ? sectionBg(dark)
            : softHoverBg(dark)
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
            <div className={`text-xs truncate ${textMuted(dark)}`}>
              {pin.note}
            </div>
          )}
          {(dayHours || (!dayDate && pin.openingHours && pin.openingHours !== "")) && (
            <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${
              dayHours?.toLowerCase().includes("closed")
                ? "text-red-400"
                : textSubtle(dark)
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
          <span className={`text-xs font-medium ${textMuted(dark)}`}>
            {pin.price}
          </span>
        )}
      </div>

      {expanded && (
        <div className="flex items-center gap-1 mt-2 ml-8" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setEditName(pin.name); setEditNote(pin.note || ""); setEditing(true); }}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
              btnHover(dark)
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => { movePinToWishlist(dayId, pin.id); setSelectedPinId(null); }}
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
                  : btnHover(dark)
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
