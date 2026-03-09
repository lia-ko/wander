"use client";

import { useState } from "react";
import { useTripStore } from "@/store/tripStore";
import { useUIStore } from "@/store/uiStore";
import { HOTEL_COLOR } from "@/store/constants";
import type { Hotel } from "@/types";
import { textMuted, textSubtle, formInput, ghostBtn, deleteBtn, isSameLocation } from "@/lib/styles";

function HotelItem({ hotel }: { hotel: Hotel }) {
  const removeHotel = useTripStore((s) => s.removeHotel);
  const updateHotel = useTripStore((s) => s.updateHotel);
  const radiusCenter = useUIStore((s) => s.radiusCenter);
  const setRadiusCenter = useUIStore((s) => s.setRadiusCenter);
  const dark = useTripStore((s) => s.darkMode);
  const [expanded, setExpanded] = useState(false);
  const [checkIn, setCheckIn] = useState(hotel.checkIn || "");
  const [checkOut, setCheckOut] = useState(hotel.checkOut || "");
  const [notes, setNotes] = useState(hotel.notes || "");

  const isRadiusActive = radiusCenter && isSameLocation(radiusCenter.lat, radiusCenter.lng, hotel.y, hotel.x);

  const handleSave = () => {
    updateHotel(hotel.id, {
      checkIn: checkIn.trim() || null,
      checkOut: checkOut.trim() || null,
      notes: notes.trim() || null,
    });
    setExpanded(false);
  };

  const inputCls = formInput(dark);

  return (
    <div
      className="mx-3 mt-2 rounded-xl overflow-hidden"
      style={{
        backgroundColor: dark ? `${HOTEL_COLOR}20` : `${HOTEL_COLOR}15`,
        border: `1px solid ${HOTEL_COLOR}40`,
      }}
    >
      <div className="px-3 py-2 flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0 cursor-pointer"
          style={{ backgroundColor: HOTEL_COLOR }}
          onClick={() => setExpanded(!expanded)}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="text-sm font-semibold truncate">{hotel.name}</div>
          <div className={`text-xs truncate ${textMuted(dark)}`}>{hotel.address}</div>
          {!expanded && (hotel.checkIn || hotel.checkOut) && (
            <div className={`text-[10px] mt-0.5 ${textSubtle(dark)}`}>
              {hotel.checkIn && `In: ${hotel.checkIn}`}
              {hotel.checkIn && hotel.checkOut && " · "}
              {hotel.checkOut && `Out: ${hotel.checkOut}`}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setRadiusCenter(isRadiusActive ? null : { lat: hotel.y, lng: hotel.x, label: hotel.name })}
            className={`p-1.5 rounded-lg transition-colors ${
              isRadiusActive
                ? "bg-[#4E8098]/20 text-[#4E8098]"
                : dark ? "text-zinc-500 hover:bg-[#F5E8D8]/10" : "text-zinc-400 hover:bg-[#4E8098]/8"
            }`}
            title="Show walking radius"
            aria-label={`${isRadiusActive ? "Hide" : "Show"} walking radius for ${hotel.name}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <circle cx="12" cy="12" r="6" strokeWidth={2} strokeDasharray="3 3" />
              <circle cx="12" cy="12" r="2" strokeWidth={2} />
            </svg>
          </button>
          <button
            onClick={() => {
              if (isRadiusActive) setRadiusCenter(null);
              removeHotel(hotel.id);
            }}
            className={`p-1.5 rounded-lg transition-colors ${deleteBtn(dark)}`}
            title="Remove hotel"
            aria-label={`Remove ${hotel.name}`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-2.5 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={`text-[10px] font-medium mb-0.5 block ${textMuted(dark)}`}>Check-in</label>
              <input
                type="text"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                placeholder="e.g. Mar 8, 3:00 PM"
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className={`text-[10px] font-medium mb-0.5 block ${textMuted(dark)}`}>Check-out</label>
              <input
                type="text"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                placeholder="e.g. Mar 12, 11:00 AM"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={`text-[10px] font-medium mb-0.5 block ${textMuted(dark)}`}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Booking ref, wifi password, directions..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => setExpanded(false)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                ghostBtn(dark)
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ backgroundColor: HOTEL_COLOR }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HotelItem;
