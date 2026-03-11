"use client";

import { memo, useState } from "react";
import { useTripStore, selectActiveTrip, selectActiveDay } from "@/store/tripStore";
import { getHoursForDate, getDayDate, parseTimeToMinutes, minutesToDisplay, checkTimeConflict } from "@/lib/hours";
import { useUIStore } from "@/store/uiStore";
import { textMuted, textSubtle, sectionBg, softHoverBg, btnHover, dragOverBg, formInput, saveBtn, cancelBtn, wishlistBtn, isSameLocation } from "@/lib/styles";
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
  const [editingTime, setEditingTime] = useState(false);
  const [timeValue, setTimeValue] = useState(pin.startTime || "");
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

  // Compute day-specific hours
  const dayIndex = trip.days.findIndex((d) => d.id === dayId);
  const dayDate = trip.startDate ? getDayDate(trip.startDate, dayIndex) : null;
  const dayHours = pin.openingHours && dayDate ? getHoursForDate(pin.openingHours, dayDate) : null;

  // Time conflict check
  const startMins = parseTimeToMinutes(pin.startTime);
  const conflict = startMins !== null
    ? checkTimeConflict(startMins, pin.openingHours, dayDate)
    : null;

  const handleSaveEdit = () => {
    if (editName.trim()) {
      updatePin(dayId, pin.id, { name: editName.trim(), note: editNote.trim() || null });
    }
    setEditing(false);
  };

  const handleSaveTime = () => {
    const trimmed = timeValue.trim();
    if (trimmed && parseTimeToMinutes(trimmed) === null) {
      // Invalid time — clear
      updatePin(dayId, pin.id, { startTime: undefined });
    } else {
      updatePin(dayId, pin.id, { startTime: trimmed || undefined });
    }
    setEditingTime(false);
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
        {/* Time badge or index */}
        {pin.startTime && startMins !== null ? (
          <div
            className="flex flex-col items-center flex-shrink-0 w-6"
            onClick={(e) => { e.stopPropagation(); setTimeValue(pin.startTime || ""); setEditingTime(true); }}
            title="Click to edit time"
          >
            <span className={`text-[9px] font-semibold leading-tight ${
              conflict === "closed" ? "text-red-400" : dark ? "text-[#DAA520]" : "text-[#4E8098]"
            }`}>
              {minutesToDisplay(startMins)}
            </span>
            {conflict === "closed" && (
              <span className="text-[7px] text-red-400 leading-tight">closed</span>
            )}
          </div>
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
              dayHours?.toLowerCase().includes("closed") || conflict === "closed"
                ? "text-red-400"
                : textSubtle(dark)
            }`}>
              <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">{dayHours || pin.openingHours}</span>
              {conflict === "closed" && pin.startTime && (
                <span className="text-red-400 font-medium flex-shrink-0">— arrives before open</span>
              )}
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

      {/* Inline time editor */}
      {editingTime && (
        <div className="flex items-center gap-1.5 mt-1.5 ml-8" onClick={(e) => e.stopPropagation()}>
          <input
            type="time"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveTime(); if (e.key === "Escape") { setEditingTime(false); } }}
            onBlur={handleSaveTime}
            autoFocus
            aria-label="Start time"
            className={`px-2 py-1 rounded-lg text-xs outline-none ${
              dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8]" : "bg-[#4E8098]/8 text-zinc-900"
            }`}
          />
          <button
            onClick={() => { updatePin(dayId, pin.id, { startTime: undefined }); setEditingTime(false); }}
            className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
              dark ? "text-zinc-500 hover:text-red-400" : "text-zinc-400 hover:text-red-500"
            }`}
            title="Clear time"
          >
            Clear
          </button>
        </div>
      )}

      {expanded && (
        <div className="flex items-center gap-0.5 mt-1.5 ml-8" onClick={(e) => e.stopPropagation()}>
          {/* Edit */}
          <button
            onClick={() => { setEditName(pin.name); setEditNote(pin.note || ""); setEditing(true); }}
            className={`p-1.5 rounded-lg transition-colors ${btnHover(dark)}`}
            title="Edit name & note"
            aria-label="Edit stop"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          {/* Set / edit time */}
          {!editingTime && (
            <button
              onClick={() => { setTimeValue(pin.startTime || ""); setEditingTime(true); }}
              className={`p-1.5 rounded-lg transition-colors ${
                pin.startTime
                  ? dark ? "text-[#DAA520] bg-[#DAA520]/10 hover:bg-[#DAA520]/15" : "text-[#4E8098] bg-[#4E8098]/10 hover:bg-[#4E8098]/15"
                  : btnHover(dark)
              }`}
              title={pin.startTime ? `Time: ${minutesToDisplay(startMins!)} — click to edit` : "Set start time"}
              aria-label={pin.startTime ? "Edit start time" : "Set start time"}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          {/* Wishlist */}
          <button
            onClick={() => { movePinToWishlist(dayId, pin.id); setSelectedPinId(null); }}
            className={`p-1.5 rounded-lg transition-colors ${wishlistBtn(dark)}`}
            title="Move to wishlist"
            aria-label="Move to wishlist"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          {/* Walking radius */}
          {pin.y !== 0 && pin.x !== 0 && (
            <button
              onClick={() => {
                const isActive = radiusCenter && isSameLocation(radiusCenter.lat, radiusCenter.lng, pin.y, pin.x);
                setRadiusCenter(isActive ? null : { lat: pin.y, lng: pin.x, label: pin.name });
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                radiusCenter && isSameLocation(radiusCenter.lat, radiusCenter.lng, pin.y, pin.x)
                  ? "bg-[#4E8098]/20 text-[#4E8098]"
                  : btnHover(dark)
              }`}
              title="Show walking radius"
              aria-label="Show walking radius"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
                <circle cx="12" cy="12" r="4" strokeWidth={2} />
              </svg>
            </button>
          )}

          <div className={`w-px h-4 mx-0.5 ${dark ? "bg-white/10" : "bg-black/10"}`} />

          {/* Remove */}
          <button
            onClick={() => { removePin(dayId, pin.id); setSelectedPinId(null); }}
            className="p-1.5 rounded-lg transition-colors text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
            title="Remove stop"
            aria-label="Remove stop"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});
