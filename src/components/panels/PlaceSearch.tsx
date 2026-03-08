"use client";

import { useState, useEffect, useRef } from "react";
import { useTripStore } from "@/store/tripStore";
import { searchPlaces, type GeoResult } from "@/lib/geocode";

export default function PlaceSearch({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, lat: number, lng: number, displayName: string) => void;
  onCancel: () => void;
}) {
  const dark = useTripStore((s) => s.darkMode);
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const center = trip?.center ?? { lat: 0, lng: 0 };
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
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
      setSearching(true);
      const res = await searchPlaces(query, center);
      setResults(res);
      setSearching(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, center]);

  return (
    <div className={`mx-2 mt-1 rounded-xl overflow-hidden ${dark ? "bg-white/10" : "bg-black/5"}`}>
      <div className="px-3 pt-2.5 pb-1.5">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
          placeholder="Search for a place..."
          className={`w-full px-2.5 py-2 rounded-lg text-sm outline-none ${
            dark ? "bg-white/10 text-white placeholder:text-zinc-500" : "bg-white text-zinc-900 placeholder:text-zinc-400"
          }`}
        />
      </div>

      {searching && (
        <div className={`px-5 py-2 text-xs ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
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
                dark ? "hover:bg-white/10" : "hover:bg-black/5"
              }`}
            >
              <span className={`text-xs ${dark ? "text-zinc-500" : "text-zinc-400"}`}>&#128205;</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className={`text-xs truncate ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{r.displayName}</div>
              </div>
              <span className={`text-xs font-semibold ${dark ? "text-blue-400" : "text-blue-500"}`}>+ Add</span>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <div className={`px-5 py-3 text-xs ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
          No results found
        </div>
      )}

      <div className="px-3 pb-2.5 pt-1">
        <button
          onClick={onCancel}
          className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            dark ? "text-zinc-400 hover:bg-white/10" : "text-zinc-500 hover:bg-black/5"
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
