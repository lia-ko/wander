"use client";

import { useState, useEffect, useRef } from "react";
import { useTripStore } from "@/store/tripStore";
import { searchCities, type GeoResult } from "@/lib/geocode";
import { DAY_COLORS } from "@/store/constants";

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const sMonth = s.toLocaleDateString("en-US", { month: "short" });
  const eMonth = e.toLocaleDateString("en-US", { month: "short" });
  if (sMonth === eMonth) {
    return `${sMonth} ${s.getDate()}\u2013${e.getDate()}`;
  }
  return `${sMonth} ${s.getDate()} \u2013 ${eMonth} ${e.getDate()}`;
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

function NewTripModal() {
  const addTrip = useTripStore((s) => s.addTrip);
  const setNewTripModalOpen = useTripStore((s) => s.setNewTripModalOpen);
  const dark = useTripStore((s) => s.darkMode);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("\u{1F30D}");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [destResults, setDestResults] = useState<GeoResult[]>([]);
  const [selectedDest, setSelectedDest] = useState<GeoResult | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const emojis = ["\u{1F30D}", "\u{1F3D9}\uFE0F", "\u{1F3F0}", "\u{1F333}", "\u26F0\uFE0F", "\u{1F3D6}\uFE0F", "\u2708\uFE0F"];

  useEffect(() => {
    if (!destQuery.trim() || destQuery.length < 2 || selectedDest) {
      setDestResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchCities(destQuery);
      setDestResults(results);
      setSearching(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [destQuery, selectedDest]);

  const handleSelectDest = (result: GeoResult) => {
    setSelectedDest(result);
    setDestQuery(result.displayName);
    setDestResults([]);
    if (!name.trim()) setName(result.name);
  };

  const numDays = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const dateLabel = startDate && endDate ? formatDateRange(startDate, endDate) : "";

  const handleCreate = () => {
    if (!name.trim() || !selectedDest || !startDate || !endDate) return;

    const genId = () => Date.now() + Math.floor(Math.random() * 10000);
    const count = daysBetween(startDate, endDate);

    addTrip(
      name.trim(),
      emoji,
      dateLabel,
      selectedDest.displayName,
      { lat: selectedDest.lat, lng: selectedDest.lng },
      startDate
    );

    // After addTrip creates 1 day, add remaining days
    const store = useTripStore.getState();
    const trip = store.trips[store.trips.length - 1];
    if (count > 1) {
      const newDays = Array.from({ length: count - 1 }, (_, i) => ({
        id: genId() + i + 1,
        label: `Day ${i + 2}`,
        sublabel: "",
        color: DAY_COLORS[(i + 1) % DAY_COLORS.length],
        pins: [],
      }));
      useTripStore.setState((s) => ({
        trips: s.trips.map((t) =>
          t.id === trip.id ? { ...t, days: [...t.days, ...newDays] } : t
        ),
      }));
    }

    setNewTripModalOpen(false);
  };

  const inputClass = `w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors ${
    dark ? "bg-[#F5E8D8]/10 placeholder:text-zinc-500 focus:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 placeholder:text-zinc-400 focus:bg-black/[.08]"
  }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setNewTripModalOpen(false)} />
      <div className={`relative w-[380px] rounded-2xl border shadow-2xl p-5 ${
        dark ? "bg-[#1C1C1C] border-[#F5E8D8]/10 text-[#F5E8D8]" : "bg-white border-[#4E8098]/10 text-zinc-900"
      }`}>
        <h2 className="text-lg font-bold mb-4">New Trip</h2>

        {/* Destination search */}
        <div className="mb-3 relative">
          <label className={`text-xs font-medium mb-1.5 block ${dark ? "text-zinc-400" : "text-zinc-500"}`}>Destination</label>
          <input
            type="text"
            value={destQuery}
            onChange={(e) => { setDestQuery(e.target.value); setSelectedDest(null); }}
            placeholder="Search for a city..."
            autoFocus
            className={`${inputClass} ${selectedDest ? "ring-2 ring-[#90CCB8]" : ""}`}
          />
          {selectedDest && (
            <span className="absolute right-3 top-[34px] text-[#90CCB8] text-sm">&#10003;</span>
          )}
          {destResults.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto ${
              dark ? "bg-[#252525] border-[#F5E8D8]/10" : "bg-white border-[#4E8098]/15"
            }`}>
              {destResults.map((r) => (
                <button
                  key={r.placeId}
                  onClick={() => handleSelectDest(r)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm transition-colors ${
                    dark ? "hover:bg-[#F5E8D8]/10" : "hover:bg-[#4E8098]/8"
                  }`}
                >
                  <span className="text-base">&#128205;</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.name}</div>
                    <div className={`text-xs truncate ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{r.displayName}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {searching && (
            <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border px-3 py-2 text-xs ${
              dark ? "bg-[#252525] border-[#F5E8D8]/10 text-zinc-400" : "bg-white border-[#4E8098]/15 text-zinc-500"
            }`}>Searching...</div>
          )}
        </div>

        {/* Emoji picker */}
        <div className="mb-3">
          <label className={`text-xs font-medium mb-1.5 block ${dark ? "text-zinc-400" : "text-zinc-500"}`}>Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {emojis.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                  emoji === e
                    ? "ring-2 ring-[#4E8098] scale-110"
                    : dark ? "hover:bg-[#F5E8D8]/10" : "hover:bg-[#4E8098]/8"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="mb-3">
          <label className={`text-xs font-medium mb-1.5 block ${dark ? "text-zinc-400" : "text-zinc-500"}`}>Trip Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            placeholder="e.g. Toronto Weekend"
            className={inputClass}
          />
        </div>

        {/* Date range */}
        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${dark ? "text-zinc-400" : "text-zinc-500"}`}>Dates</label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (!endDate || e.target.value > endDate) setEndDate(e.target.value);
              }}
              className={`flex-1 ${inputClass}`}
            />
            <span className={`text-xs ${dark ? "text-zinc-500" : "text-zinc-400"}`}>to</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`flex-1 ${inputClass}`}
            />
          </div>
          {numDays > 0 && (
            <div className={`text-xs mt-1.5 ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
              {dateLabel} &middot; {numDays} {numDays === 1 ? "day" : "days"}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !selectedDest || !startDate || !endDate}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#4E8098] hover:bg-[#3D6B80] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Create Trip
          </button>
          <button
            onClick={() => setNewTripModalOpen(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              dark ? "bg-[#F5E8D8]/10 hover:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 hover:bg-[#4E8098]/12"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TripSelector() {
  const trips = useTripStore((s) => s.trips);
  const activeTripId = useTripStore((s) => s.activeTripId);
  const setActiveTripId = useTripStore((s) => s.setActiveTripId);
  const removeTrip = useTripStore((s) => s.removeTrip);
  const toggleSidebar = useTripStore((s) => s.toggleSidebar);
  const newTripModalOpen = useTripStore((s) => s.newTripModalOpen);
  const setNewTripModalOpen = useTripStore((s) => s.setNewTripModalOpen);
  const dark = useTripStore((s) => s.darkMode);
  const [open, setOpen] = useState(false);

  const activeTrip = trips.find((t) => t.id === activeTripId)!;

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-inherit">
        <div className="relative flex-1">
          <button
            onClick={() => setOpen(!open)}
            className={`flex items-center gap-2 w-full text-left rounded-lg px-2 py-1.5 transition-colors ${
              dark ? "hover:bg-[#F5E8D8]/10" : "hover:bg-[#4E8098]/8"
            }`}
          >
            <span className="text-lg">{activeTrip.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{activeTrip.name}</div>
              <div className={`text-xs ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{activeTrip.dates}</div>
            </div>
            <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50 overflow-hidden
              ${dark ? "bg-[#252525] border-[#F5E8D8]/10" : "bg-white border-[#4E8098]/15"}`}>
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors
                    ${trip.id === activeTripId
                      ? dark ? "bg-[#F5E8D8]/10" : "bg-[#4E8098]/8"
                      : dark ? "hover:bg-[#F5E8D8]/6" : "hover:bg-[#4E8098]/8"
                    }`}
                >
                  <button
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    onClick={() => { setActiveTripId(trip.id); setOpen(false); }}
                  >
                    <span>{trip.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{trip.name}</div>
                      <div className={`text-xs ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{trip.destination}</div>
                    </div>
                    <span className={`text-xs flex-shrink-0 ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{trip.dates}</span>
                  </button>
                  {trips.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrip(trip.id);
                        if (trips.length <= 2) setOpen(false);
                      }}
                      className={`p-1 rounded transition-colors flex-shrink-0 ${
                        dark ? "text-zinc-500 hover:text-red-400 hover:bg-[#F5E8D8]/10" : "text-zinc-400 hover:text-red-500 hover:bg-[#4E8098]/8"
                      }`}
                      title="Delete trip"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => { setOpen(false); setNewTripModalOpen(true); }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm border-t
                  ${dark ? "border-[#F5E8D8]/10 text-zinc-400 hover:bg-[#F5E8D8]/6" : "border-[#4E8098]/10 text-zinc-500 hover:bg-[#4E8098]/8"}`}
              >
                <span>+</span>
                <span>New trip</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className={`p-1.5 rounded-lg transition-colors ${dark ? "hover:bg-[#F5E8D8]/10" : "hover:bg-[#4E8098]/8"}`}
          title="Collapse panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {newTripModalOpen && <NewTripModal />}
    </>
  );
}
