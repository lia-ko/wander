"use client";

import { memo, useState } from "react";
import { useTripStore, selectActiveTrip, selectActiveDay } from "@/store/tripStore";
import { getHoursForDate, getDayDate } from "@/lib/hours";
import { getPinBadge } from "@/lib/pinUtils";
import { useUIStore } from "@/store/uiStore";
import { textMuted, textSubtle, sectionBg, softHoverBg, btnHover, dragOverBg, formInput, saveBtn, cancelBtn, wishlistBtn, removeBtn, isSameLocation } from "@/lib/styles";
import type { Pin } from "@/types";
import type { DragHandlers } from "./types";

export default memo(function StopItem({ pin, index, dayId, dayColor, onDragStart, onDragOver, onDrop, isDragOver }: {
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
  const setSelectedPinId = useUIStore((s) => s.setSelectedPinId);
  const selectedPinId = useUIStore((s) => s.selectedPinId);
  const radiusCenter = useUIStore((s) => s.radiusCenter);
  const setRadiusCenter = useUIStore((s) => s.setRadiusCenter);
  const trip = useTripStore(selectActiveTrip);
  const day = useTripStore(selectActiveDay);
  const isSelected = selectedPinId === pin.id;
  const pinCount = day.pins.length;

  // Compute day-specific hours
  const dayIndex = trip.days.findIndex((d) => d.id === dayId);
  const dayDate = trip.startDate ? getDayDate(trip.startDate, dayIndex) : null;
  const dayHours = pin.openingHours && dayDate ? getHoursForDate(pin.openingHours, dayDate) : null;

  const badge = getPinBadge(pin);

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
          aria-label="Stop name"
          className={`${formInput(dark)} mb-1.5`}
          placeholder="Stop name"
        />
        <input
          type="text"
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEditing(false); }}
          aria-label="Stop note"
          className={`${formInput(dark)} mb-2`}
          placeholder="Note (optional)"
        />
        <div className="flex gap-1.5">
          <button onClick={handleSaveEdit} className={saveBtn}>Save</button>
          <button onClick={() => setEditing(false)} className={cancelBtn(dark)}>Cancel</button>
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
      aria-roledescription="Draggable stop"
      aria-label={pin.name}
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
              wishlistBtn(dark)
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
            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${removeBtn}`}
          >
            Remove
          </button>
          {pin.y !== 0 && pin.x !== 0 && (
            <button
              onClick={() => {
                const isActive = radiusCenter && isSameLocation(radiusCenter.lat, radiusCenter.lng, pin.y, pin.x);
                setRadiusCenter(isActive ? null : { lat: pin.y, lng: pin.x, label: pin.name });
              }}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                radiusCenter && isSameLocation(radiusCenter.lat, radiusCenter.lng, pin.y, pin.x)
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
});
