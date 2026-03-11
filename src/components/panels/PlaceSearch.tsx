"use client";

import { useState, useEffect, useRef } from "react";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { searchPlaces, type GeoResult } from "@/lib/geocode";
import { textMuted, textSubtle, sectionBg, hoverBg, inputBase, ghostBtn, SEARCH_DEBOUNCE_MS } from "@/lib/styles";

export default function PlaceSearch({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, lat: number, lng: number, displayName: string) => void;
  onCancel: () => void;
}) {
  const dark = useTripStore((s) => s.darkMode);
  const trip = useTripStore(selectActiveTrip);
  const center = trip?.center ?? { lat: 0, lng: 0 };
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSearching(true);
      try {
        const res = await searchPlaces(query, center, controller.signal);
        if (!controller.signal.aborted) {
          setResults(res);
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [query, center]);

  return (
    <div className={`mx-2 mt-1 rounded-xl overflow-hidden ${sectionBg(dark)}`}>
      <div className="px-3 pt-2.5 pb-1.5">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
          placeholder="Search for a place..."
          aria-label="Search for a place"
          className={`w-full px-2.5 py-2 rounded-lg text-sm outline-none ${
            inputBase(dark)
          }`}
        />
      </div>

      {searching && (
        <div className={`px-5 py-2 text-xs ${textMuted(dark)}`}>
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.placeId}
              onClick={() => onAdd(r.name, r.lat, r.lng, r.displayName)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors ${
                hoverBg(dark)
              }`}
            >
              <span className={`text-xs ${textSubtle(dark)}`}>&#128205;</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className={`text-xs truncate ${textMuted(dark)}`}>{r.displayName}</div>
              </div>
              <span className={`text-xs font-semibold ${dark ? "text-[#DAA520]" : "text-[#4E8098]"}`}>+ Add</span>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <div className={`px-5 py-3 text-xs ${textSubtle(dark)}`}>
          No results found
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
