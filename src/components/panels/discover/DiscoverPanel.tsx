"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTripStore } from "@/store/tripStore";
import GlassPanel from "@/components/ui/GlassPanel";
import { searchOverpass, type OverpassResult } from "@/lib/overpass";
import { getDayDate } from "@/lib/hours";
import type { DiscoverTab, Pin } from "@/types";
import { mapOsmToFoodType, mapOsmToAttrType, formatCuisine } from "./helpers";
import ResultItem from "./ResultItem";
import { textMuted, textSubtle, hoverBg, accentActive } from "@/lib/styles";

export default function DiscoverPanel() {
  const discoverOpen = useTripStore((s) => s.discoverOpen);
  const discoverTab = useTripStore((s) => s.discoverTab);
  const toggleDiscover = useTripStore((s) => s.toggleDiscover);
  const closeDiscover = useTripStore((s) => s.closeDiscover);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const addPin = useTripStore((s) => s.addPin);
  const addToWishlist = useTripStore((s) => s.addToWishlist);
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const sidebarWidth = useTripStore((s) => s.sidebarWidth);
  const day = useTripStore((s) => {
    const tr = s.trips.find((t) => t.id === s.activeTripId)!;
    return tr.days.find((d) => d.id === s.activeDayId)!;
  });
  const dark = useTripStore((s) => s.darkMode);

  const [searchQuery, setSearchQuery] = useState("");
  const [nearPinId, setNearPinId] = useState<number | "trip-center" | string | null>(null);
  const [results, setResults] = useState<OverpassResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const cacheRef = useRef<Map<string, OverpassResult[]>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const allPins: Pin[] = trip.days.flatMap((d) => d.pins).filter((p) => p.y !== 0 && p.x !== 0);
  const dayPins: Pin[] = (day?.pins ?? []).filter((p) => p.y !== 0 && p.x !== 0);

  const effectiveDefault: number | string | null =
    dayPins.length > 0 ? dayPins[0].id :
    trip.hotels.length > 0 ? trip.hotels[0].id :
    null;

  const activeNearId = nearPinId !== null ? nearPinId : effectiveDefault;

  const hasSearchCenter = activeNearId !== null;

  const dayIndex = trip.days.findIndex((d) => d.id === activeDayId);
  const dayDate = trip.startDate && dayIndex >= 0 ? getDayDate(trip.startDate, dayIndex) : null;

  const getSearchCenter = useCallback((): { lat: number; lng: number } | null => {
    if (activeNearId === null) return null;
    if (activeNearId === "trip-center") {
      return trip.center ?? { lat: 0, lng: 0 };
    }
    if (typeof activeNearId === "string" && activeNearId.startsWith("hotel-")) {
      const hotel = trip.hotels.find((h) => h.id === activeNearId);
      if (hotel) return { lat: hotel.y, lng: hotel.x };
    }
    const pin = allPins.find((p) => p.id === activeNearId);
    if (pin) return { lat: pin.y, lng: pin.x };
    return null;
  }, [activeNearId, trip.center, trip.hotels, allPins]);

  const doSearch = useCallback((nameFilter?: string) => {
    const center = getSearchCenter();
    if (!center || (!center.lat && !center.lng)) return;
    const cacheKey = `${discoverTab}|${center.lat.toFixed(4)},${center.lng.toFixed(4)}|${nameFilter || ""}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setResults(cached);
      setSearched(true);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSearched(true);
    searchOverpass(center, discoverTab, nameFilter || undefined, 5000, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      r.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
      cacheRef.current.set(cacheKey, r);
      setResults(r);
      setLoading(false);
    });
  }, [getSearchCenter, discoverTab]);

  useEffect(() => {
    if (!discoverOpen || !hasSearchCenter) return;
    doSearch();
    return () => { abortRef.current?.abort(); };
  }, [discoverTab, activeNearId, discoverOpen, doSearch, hasSearchCenter]);

  const handleSearch = () => {
    doSearch(searchQuery.trim() || undefined);
  };

  const isAdded = (result: OverpassResult) => {
    if (!day) return false;
    return day.pins.some((p) => Math.abs(p.y - result.lat) < 0.0001 && Math.abs(p.x - result.lng) < 0.0001);
  };

  const isWishlisted = (result: OverpassResult) => {
    return (trip.wishlist ?? []).some((p) => Math.abs(p.y - result.lat) < 0.0001 && Math.abs(p.x - result.lng) < 0.0001);
  };

  const buildPinData = (result: OverpassResult) => {
    const isFood = discoverTab === "eat" || discoverTab === "grocers";
    const foodType = isFood ? mapOsmToFoodType(result) : undefined;
    const attrType = !isFood ? mapOsmToAttrType(result) : undefined;
    const cuisine = result.cuisine ? formatCuisine(result.cuisine) : null;
    return {
      name: result.name,
      category: isFood ? "Food" : "Attraction",
      note: cuisine || result.address || null,
      transport: null as null,
      travelTime: null as null,
      x: result.lng,
      y: result.lat,
      openingHours: result.tags.opening_hours || null,
      ...(foodType ? { foodType } : {}),
      ...(attrType ? { attrType } : {}),
    };
  };

  const handleAdd = (result: OverpassResult) => {
    if (isAdded(result)) return;
    addPin(activeDayId, buildPinData(result));
  };

  const handleWishlist = (result: OverpassResult) => {
    if (isWishlisted(result)) return;
    addToWishlist(buildPinData(result));
  };

  if (!discoverOpen) return null;

  const tabs: { key: DiscoverTab; emoji: string; label: string }[] = [
    { key: "eat", emoji: "\u{1F37D}\uFE0F", label: "Eat Out" },
    { key: "grocers", emoji: "\u{1F6D2}", label: "Grocers" },
    { key: "attractions", emoji: "\u{1F5FA}\uFE0F", label: "Attractions" },
  ];

  const panelLeft = (sidebarWidth ?? 310) + 20;

  return (
    <GlassPanel className="absolute top-4 bottom-4 w-[360px] z-20 flex flex-col overflow-hidden" style={{ left: `${panelLeft}px` }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => toggleDiscover(tab.key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                discoverTab === tab.key
                  ? accentActive(dark)
                  : dark ? "text-zinc-400 hover:bg-[#F5E8D8]/6" : "text-zinc-500 hover:bg-[#4E8098]/8"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={closeDiscover}
          className={`p-1 rounded-lg transition-colors ${hoverBg(dark)}`}
          aria-label="Close discover panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search near + filter */}
      <div className="px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium flex-shrink-0 ${textMuted(dark)}`}>
            Search near:
          </span>
          <select
            value={activeNearId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setNearPinId(v === "trip-center" || v.startsWith("hotel-") ? v : Number(v));
            }}
            disabled={!hasSearchCenter}
            aria-label="Search near location"
            className={`flex-1 min-w-0 text-xs px-2 py-1.5 rounded-lg outline-none truncate ${
              dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8]" : "bg-[#4E8098]/8 text-zinc-900"
            } ${!hasSearchCenter ? "opacity-50" : ""}`}
          >
            {!hasSearchCenter && (
              <option value="">Add a stop or hotel first</option>
            )}
            {trip.hotels.map((h) => (
              <option key={h.id} value={h.id}>{"\u{1F3E8}"} {h.name}</option>
            ))}
            {dayPins.length > 0 && (
              <optgroup label={day?.label ?? "Today"}>
                {dayPins.map((pin) => (
                  <option key={pin.id} value={pin.id}>{pin.name}</option>
                ))}
              </optgroup>
            )}
            {allPins.filter((p) => !dayPins.some((dp) => dp.id === p.id)).length > 0 && (
              <optgroup label="Other days">
                {allPins.filter((p) => !dayPins.some((dp) => dp.id === p.id)).map((pin) => (
                  <option key={pin.id} value={pin.id}>{pin.name}</option>
                ))}
              </optgroup>
            )}
            <option value="trip-center">{trip.destination || "Trip center"}</option>
          </select>
        </div>

        <div className={`flex gap-1.5 ${!hasSearchCenter ? "opacity-50 pointer-events-none" : ""}`}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Filter by name..."
            aria-label="Filter results by name"
            disabled={!hasSearchCenter}
            className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-colors ${
              dark ? "bg-[#F5E8D8]/10 placeholder:text-zinc-500 focus:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 placeholder:text-zinc-400 focus:bg-black/[.08]"
            }`}
          />
          <button
            onClick={handleSearch}
            disabled={!hasSearchCenter}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8] hover:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 text-zinc-700 hover:bg-[#4E8098]/12"
            }`}
          >
            Search
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: day?.color }} />
            <span className={`text-xs ${textMuted(dark)}`}>
              Adding to {day?.label}
            </span>
          </div>
          {!loading && searched && (
            <span className={`text-[10px] ${dark ? "text-zinc-600" : "text-zinc-400"}`}>
              {results.length} results
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-1 pb-2 scrollbar-hide">
        {!hasSearchCenter && (
          <div className={`text-center py-12 px-6 ${textMuted(dark)}`}>
            <div className="text-2xl mb-3">{"\u{1F4CD}"}</div>
            <div className="text-sm font-medium mb-1">No search location set</div>
            <div className="text-xs leading-relaxed">
              Add a hotel/base or a stop to your day first, then come back to discover nearby places.
            </div>
          </div>
        )}

        {hasSearchCenter && loading && (
          <div className={`text-center py-8 text-sm ${textSubtle(dark)}`}>
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Searching nearby places...
          </div>
        )}

        {hasSearchCenter && !loading && searched && results.length === 0 && (
          <div className={`text-center py-8 text-sm ${textSubtle(dark)}`}>
            No places found nearby. Try a different location or search term.
          </div>
        )}

        {hasSearchCenter && !loading && results.map((result) => (
          <ResultItem
            key={result.id}
            result={result}
            tab={discoverTab}
            added={isAdded(result)}
            wishlisted={isWishlisted(result)}
            onAdd={() => handleAdd(result)}
            onWishlist={() => handleWishlist(result)}
            dayDate={dayDate}
          />
        ))}
      </div>
    </GlassPanel>
  );
}
