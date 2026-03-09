"use client";

import { useState } from "react";
import { useTripStore } from "@/store/tripStore";
import { HOTEL_COLOR } from "@/store/constants";
import { searchPlaces, type GeoResult } from "@/lib/geocode";
import type { Hotel } from "@/types";

function HotelSearch({ onSelect, onCancel }: {
  onSelect: (name: string, address: string, lat: number, lng: number) => void;
  onCancel: () => void;
}) {
  const dark = useTripStore((s) => s.darkMode);
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const center = trip?.center ?? { lat: 0, lng: 0 };
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useState<NodeJS.Timeout | null>(null);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    if (val.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await searchPlaces(val, center);
      setResults(res);
      setSearching(false);
    }, 400);
    debounceRef[1](t);
  };

  return (
    <div className={`mx-3 mt-2 rounded-xl overflow-hidden ${dark ? "bg-[#F5E8D8]/10" : "bg-[#4E8098]/8"}`}>
      <div className="px-3 pt-2.5 pb-1.5">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
          placeholder="Search for hotel / accommodation..."
          autoFocus
          className={`w-full px-2.5 py-2 rounded-lg text-sm outline-none ${
            dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8] placeholder:text-zinc-500" : "bg-white text-zinc-900 placeholder:text-zinc-400"
          }`}
        />
      </div>
      {searching && (
        <div className={`px-5 py-2 text-xs ${dark ? "text-zinc-400" : "text-zinc-500"}`}>Searching...</div>
      )}
      {results.length > 0 && (
        <div className="max-h-40 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.placeId}
              onClick={() => {
                const addr = r.displayName.split(",").slice(1, 3).join(",").trim();
                onSelect(r.name, addr, r.lat, r.lng);
              }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors ${
                dark ? "hover:bg-[#F5E8D8]/10" : "hover:bg-[#4E8098]/8"
              }`}
            >
              <span className="text-xs">🏨</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className={`text-xs truncate ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{r.displayName}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="px-3 pb-2.5 pt-1">
        <button
          onClick={onCancel}
          className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            dark ? "text-zinc-400 hover:bg-[#F5E8D8]/10" : "text-zinc-500 hover:bg-[#4E8098]/8"
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function HotelItem({ hotel }: { hotel: Hotel }) {
  const removeHotel = useTripStore((s) => s.removeHotel);
  const updateHotel = useTripStore((s) => s.updateHotel);
  const radiusCenter = useTripStore((s) => s.radiusCenter);
  const setRadiusCenter = useTripStore((s) => s.setRadiusCenter);
  const dark = useTripStore((s) => s.darkMode);
  const [expanded, setExpanded] = useState(false);
  const [checkIn, setCheckIn] = useState(hotel.checkIn || "");
  const [checkOut, setCheckOut] = useState(hotel.checkOut || "");
  const [notes, setNotes] = useState(hotel.notes || "");

  const isRadiusActive = radiusCenter && Math.abs(radiusCenter.lat - hotel.y) < 0.0001 && Math.abs(radiusCenter.lng - hotel.x) < 0.0001;

  const handleSave = () => {
    updateHotel(hotel.id, {
      checkIn: checkIn.trim() || null,
      checkOut: checkOut.trim() || null,
      notes: notes.trim() || null,
    });
    setExpanded(false);
  };

  const inputCls = `w-full px-2 py-1.5 rounded-lg text-xs outline-none ${
    dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8] placeholder:text-zinc-500" : "bg-white text-zinc-900 placeholder:text-zinc-400"
  }`;

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
          <div className={`text-xs truncate ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{hotel.address}</div>
          {!expanded && (hotel.checkIn || hotel.checkOut) && (
            <div className={`text-[10px] mt-0.5 ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
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
            className={`p-1.5 rounded-lg transition-colors ${dark ? "text-zinc-500 hover:text-red-400 hover:bg-[#F5E8D8]/10" : "text-zinc-400 hover:text-red-500 hover:bg-[#4E8098]/8"}`}
            title="Remove hotel"
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
              <label className={`text-[10px] font-medium mb-0.5 block ${dark ? "text-zinc-400" : "text-zinc-500"}`}>Check-in</label>
              <input
                type="text"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                placeholder="e.g. Mar 8, 3:00 PM"
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className={`text-[10px] font-medium mb-0.5 block ${dark ? "text-zinc-400" : "text-zinc-500"}`}>Check-out</label>
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
            <label className={`text-[10px] font-medium mb-0.5 block ${dark ? "text-zinc-400" : "text-zinc-500"}`}>Notes</label>
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
                dark ? "text-zinc-400 hover:bg-[#F5E8D8]/10" : "text-zinc-500 hover:bg-[#4E8098]/8"
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

export default function HotelStrip() {
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const addHotel = useTripStore((s) => s.addHotel);
  const dark = useTripStore((s) => s.darkMode);
  const [searching, setSearching] = useState(false);

  const handleSelect = (name: string, address: string, lat: number, lng: number) => {
    addHotel({ name, address, x: lng, y: lat });
    setSearching(false);
  };

  if (searching) {
    return (
      <>
        {trip.hotels.map((h) => <HotelItem key={h.id} hotel={h} />)}
        <HotelSearch onSelect={handleSelect} onCancel={() => setSearching(false)} />
      </>
    );
  }

  return (
    <>
      {trip.hotels.map((h) => <HotelItem key={h.id} hotel={h} />)}
      <button
        onClick={() => setSearching(true)}
        className={`flex items-center gap-2 mx-3 mt-2 px-3 py-2 rounded-xl text-sm transition-colors w-auto ${
          dark ? "text-zinc-400 hover:bg-[#F5E8D8]/6" : "text-zinc-400 hover:bg-[#F0D5A8]/25"
        }`}
      >
        <span className="w-7 h-7 rounded-lg border-2 border-dashed flex items-center justify-center text-xs"
          style={{ borderColor: HOTEL_COLOR, color: HOTEL_COLOR }}>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </span>
        <span>{trip.hotels.length === 0 ? "Set hotel / base" : "+ Add another hotel"}</span>
      </button>
    </>
  );
}
