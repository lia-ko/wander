"use client";

import { useState, useRef } from "react";
import { useTripStore } from "@/store/tripStore";
import { searchPlaces, type GeoResult } from "@/lib/geocode";
import { textMuted, sectionBg, hoverBg, inputBase, ghostBtn } from "@/lib/styles";

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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSearching(true);
      const res = await searchPlaces(val, center, controller.signal);
      if (!controller.signal.aborted) {
        setResults(res);
        setSearching(false);
      }
    }, 400);
  };

  return (
    <div className={`mx-3 mt-2 rounded-xl overflow-hidden ${sectionBg(dark)}`}>
      <div className="px-3 pt-2.5 pb-1.5">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
          placeholder="Search for hotel / accommodation..."
          autoFocus
          className={`w-full px-2.5 py-2 rounded-lg text-sm outline-none ${
            inputBase(dark)
          }`}
        />
      </div>
      {searching && (
        <div className={`px-5 py-2 text-xs ${textMuted(dark)}`}>Searching...</div>
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
                hoverBg(dark)
              }`}
            >
              <span className="text-xs">🏨</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className={`text-xs truncate ${textMuted(dark)}`}>{r.displayName}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="px-3 pb-2.5 pt-1">
        <button
          onClick={onCancel}
          className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            ghostBtn(dark)
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default HotelSearch;
