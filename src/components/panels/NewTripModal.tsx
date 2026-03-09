"use client";

import { useState, useEffect, useRef } from "react";
import { useTripStore } from "@/store/tripStore";
import { useUIStore } from "@/store/uiStore";
import { searchCities, type GeoResult } from "@/lib/geocode";
import { DAY_COLORS } from "@/store/constants";
import { textMuted, textSubtle, hoverBg, inputFocus, btnHover } from "@/lib/styles";

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
  const dark = useTripStore((s) => s.darkMode);
  const setNewTripModalOpen = useUIStore((s) => s.setNewTripModalOpen);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("\u{1F30D}");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [destResults, setDestResults] = useState<GeoResult[]>([]);
  const [selectedDest, setSelectedDest] = useState<GeoResult | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const emojis = ["\u{1F30D}", "\u{1F3D9}\uFE0F", "\u{1F3F0}", "\u{1F333}", "\u26F0\uFE0F", "\u{1F3D6}\uFE0F", "\u2708\uFE0F"];

  useEffect(() => {
    if (!destQuery.trim() || destQuery.length < 2 || selectedDest) {
      setDestResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSearching(true);
      const results = await searchCities(destQuery, controller.signal);
      if (!controller.signal.aborted) {
        setDestResults(results);
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
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
    inputFocus(dark)
  }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="new-trip-heading">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setNewTripModalOpen(false)} />
      <div className={`relative w-[380px] rounded-2xl border shadow-2xl p-5 ${
        dark ? "bg-[#1C1C1C] border-[#F5E8D8]/10 text-[#F5E8D8]" : "bg-white border-[#4E8098]/10 text-zinc-900"
      }`}>
        <h2 id="new-trip-heading" className="text-lg font-bold mb-4">New Trip</h2>

        {/* Destination search */}
        <div className="mb-3 relative">
          <label className={`text-xs font-medium mb-1.5 block ${textMuted(dark)}`}>Destination</label>
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
                    hoverBg(dark)
                  }`}
                >
                  <span className="text-base">&#128205;</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.name}</div>
                    <div className={`text-xs truncate ${textMuted(dark)}`}>{r.displayName}</div>
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
          <label className={`text-xs font-medium mb-1.5 block ${textMuted(dark)}`}>Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {emojis.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                  emoji === e
                    ? "ring-2 ring-[#4E8098] scale-110"
                    : hoverBg(dark)
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="mb-3">
          <label className={`text-xs font-medium mb-1.5 block ${textMuted(dark)}`}>Trip Name</label>
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
          <label className={`text-xs font-medium mb-1.5 block ${textMuted(dark)}`}>Dates</label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (!endDate || e.target.value > endDate) setEndDate(e.target.value);
              }}
              aria-label="Start date"
              className={`flex-1 ${inputClass}`}
            />
            <span className={`text-xs ${textSubtle(dark)}`}>to</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="End date"
              className={`flex-1 ${inputClass}`}
            />
          </div>
          {numDays > 0 && (
            <div className={`text-xs mt-1.5 ${textMuted(dark)}`}>
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
              btnHover(dark)
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewTripModal;
