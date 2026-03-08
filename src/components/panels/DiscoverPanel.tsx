"use client";

import { useState, useEffect, useCallback } from "react";
import { useTripStore } from "@/store/tripStore";
import { FOOD_TYPE_META, ATTR_TYPE_META } from "@/store/constants";
import GlassPanel from "@/components/ui/GlassPanel";
import { searchOverpass, type OverpassResult } from "@/lib/overpass";
import { getHoursForDate, getDayDate } from "@/lib/hours";
import type { DiscoverTab, FoodTypeKey, AttrTypeKey, Pin } from "@/types";

function mapOsmToFoodType(result: OverpassResult): FoodTypeKey {
  const t = result.osmType;
  const n = result.name.toLowerCase();
  const c = (result.cuisine || "").toLowerCase();

  if (t === "cafe" || n.includes("cafe") || n.includes("coffee")) return "cafe";
  if (t === "bakery" || n.includes("bakery") || c.includes("bakery")) return "bakery";
  if (c.includes("ramen") || c.includes("noodle") || n.includes("ramen")) return "ramen";
  if (c.includes("sushi") || n.includes("sushi")) return "sushi";
  if (n.includes("izakaya") || c.includes("izakaya")) return "izakaya";
  if (t === "fast_food") return "street";
  if (t === "supermarket" || t === "convenience" || t === "general") return "grocer";
  if (t === "marketplace") return "market";
  if (t === "greengrocer" || t === "butcher" || t === "deli") return "grocer";
  if (n.includes("konbini") || n.includes("familymart") || n.includes("7-eleven") || n.includes("lawson")) return "konbini";
  return "restaurant";
}

function mapOsmToAttrType(result: OverpassResult): AttrTypeKey {
  const t = result.osmType;
  const n = result.name.toLowerCase();

  if (t === "park" || t === "garden" || n.includes("park") || n.includes("garden")) return "park";
  if (t === "museum" || n.includes("museum")) return "museum";
  if (n.includes("temple") || n.includes("shrine") || n.includes("church") || n.includes("cathedral")) return "temple";
  if (t === "gallery" || t === "arts_centre" || n.includes("gallery")) return "gallery";
  if (t === "viewpoint" || n.includes("tower") || n.includes("observation")) return "viewpoint";
  if (t === "theatre" || t === "cinema") return "entertain";
  if (n.includes("mall") || n.includes("shopping")) return "shopping";
  if (t === "castle" || t === "monument" || t === "memorial" || t === "ruins") return "historic";
  return "historic";
}

function formatDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function formatCuisine(cuisine: string): string {
  return cuisine
    .split(";")[0]
    .split(",")[0]
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-px">
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`} className="text-amber-400 text-[10px]">&#9733;</span>
      ))}
      {half && <span className="text-amber-400 text-[10px] opacity-50">&#9733;</span>}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} className="text-zinc-300 dark:text-zinc-600 text-[10px]">&#9733;</span>
      ))}
    </div>
  );
}

function ResultItem({ result, tab, added, onAdd, dayDate }: {
  result: OverpassResult;
  tab: DiscoverTab;
  added: boolean;
  onAdd: () => void;
  dayDate: Date | null;
}) {
  const dark = useTripStore((s) => s.darkMode);

  let emoji = "";
  let categoryLabel = "";
  let labelColor = "";
  let cuisineLabel = "";

  if (tab === "eat" || tab === "grocers") {
    const ft = mapOsmToFoodType(result);
    if (FOOD_TYPE_META[ft]) emoji = FOOD_TYPE_META[ft].emoji;
    if (result.cuisine) cuisineLabel = formatCuisine(result.cuisine);
  } else {
    const at = mapOsmToAttrType(result);
    if (ATTR_TYPE_META[at]) {
      emoji = ATTR_TYPE_META[at].emoji;
      categoryLabel = ATTR_TYPE_META[at].label;
      labelColor = ATTR_TYPE_META[at].color;
    }
  }

  const subtitle = result.address || "";
  const dist = result.dist ?? 0;

  // Pseudo-rating: hash name for consistent display (OSM doesn't have ratings)
  let hash = 0;
  for (let i = 0; i < result.name.length; i++) hash = ((hash << 5) - hash + result.name.charCodeAt(i)) | 0;
  const pseudoRating = 3.2 + (Math.abs(hash) % 18) / 10;
  const clampedRating = Math.min(5, Math.round(pseudoRating * 10) / 10);

  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${dark ? "hover:bg-white/5" : "hover:bg-black/[.03]"}`}>
      <span className="text-lg flex-shrink-0 mt-0.5">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{result.name}</div>
        {/* Subtitle: cuisine for eat, address for others */}
        {(tab === "eat" || tab === "grocers") && cuisineLabel ? (
          <div className={`text-xs mt-0.5 ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{cuisineLabel}</div>
        ) : subtitle ? (
          <div className={`text-xs truncate mt-0.5 ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{subtitle}</div>
        ) : null}
        <div className="flex items-center gap-2 mt-1">
          {(tab === "eat" || tab === "grocers") && <StarRating rating={clampedRating} />}
          {tab === "attractions" && categoryLabel && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ color: labelColor, backgroundColor: `${labelColor}15` }}
            >
              {categoryLabel}
            </span>
          )}
          <span className={`text-[10px] ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
            {formatDist(dist)}
          </span>
        </div>
        {result.tags.opening_hours && (() => {
          const parsed = dayDate ? getHoursForDate(result.tags.opening_hours, dayDate) : result.tags.opening_hours;
          const isClosed = parsed?.toLowerCase().includes("closed");
          return (
            <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isClosed ? "text-red-400" : dark ? "text-zinc-500" : "text-zinc-400"}`}>
              <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">{parsed}</span>
            </div>
          );
        })()}
      </div>
      <button
        onClick={onAdd}
        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 mt-1 ${
          added
            ? "bg-emerald-500/15 text-emerald-500"
            : dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-black/5 text-zinc-700 hover:bg-black/10"
        }`}
      >
        {added ? "\u2713" : "+"}
      </button>
    </div>
  );
}

export default function DiscoverPanel() {
  const discoverOpen = useTripStore((s) => s.discoverOpen);
  const discoverTab = useTripStore((s) => s.discoverTab);
  const toggleDiscover = useTripStore((s) => s.toggleDiscover);
  const closeDiscover = useTripStore((s) => s.closeDiscover);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const addPin = useTripStore((s) => s.addPin);
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const sidebarWidth = useTripStore((s) => s.sidebarWidth);
  const day = useTripStore((s) => {
    const tr = s.trips.find((t) => t.id === s.activeTripId)!;
    return tr.days.find((d) => d.id === s.activeDayId)!;
  });
  const dark = useTripStore((s) => s.darkMode);

  const [searchQuery, setSearchQuery] = useState("");
  const [nearPinId, setNearPinId] = useState<number | "trip-center">("trip-center");
  const [results, setResults] = useState<OverpassResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const allPins: Pin[] = trip.days.flatMap((d) => d.pins).filter((p) => p.y !== 0 && p.x !== 0);

  // Compute the calendar date for the active day (for parsing opening hours)
  const dayIndex = trip.days.findIndex((d) => d.id === activeDayId);
  const dayDate = trip.startDate && dayIndex >= 0 ? getDayDate(trip.startDate, dayIndex) : null;

  const getSearchCenter = useCallback((): { lat: number; lng: number } => {
    if (nearPinId === "trip-center") {
      return trip.center ?? { lat: 0, lng: 0 };
    }
    const pin = allPins.find((p) => p.id === nearPinId);
    if (pin) return { lat: pin.y, lng: pin.x };
    return trip.center ?? { lat: 0, lng: 0 };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearPinId, trip.center, allPins.length]);

  const doSearch = useCallback((nameFilter?: string) => {
    const center = getSearchCenter();
    if (!center.lat && !center.lng) return;
    setLoading(true);
    setSearched(true);
    searchOverpass(center, discoverTab, nameFilter || undefined).then((r) => {
      setResults(r);
      setLoading(false);
    });
  }, [getSearchCenter, discoverTab]);

  // Auto-search when tab/location changes
  useEffect(() => {
    if (!discoverOpen) return;
    doSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverTab, nearPinId, discoverOpen]);

  const handleSearch = () => {
    doSearch(searchQuery.trim() || undefined);
  };

  const isAdded = (result: OverpassResult) => {
    if (!day) return false;
    return day.pins.some((p) => Math.abs(p.y - result.lat) < 0.0001 && Math.abs(p.x - result.lng) < 0.0001);
  };

  const handleAdd = (result: OverpassResult) => {
    if (isAdded(result)) return;
    const isFood = discoverTab === "eat" || discoverTab === "grocers";
    const foodType = isFood ? mapOsmToFoodType(result) : undefined;
    const attrType = !isFood ? mapOsmToAttrType(result) : undefined;
    const cuisine = result.cuisine ? formatCuisine(result.cuisine) : null;

    addPin(activeDayId, {
      name: result.name,
      category: isFood ? "Food" : "Attraction",
      note: cuisine || result.address || null,
      transport: null,
      travelTime: null,
      x: result.lng,
      y: result.lat,
      openingHours: result.tags.opening_hours || null,
      ...(foodType ? { foodType } : {}),
      ...(attrType ? { attrType } : {}),
    });
  };

  if (!discoverOpen) return null;

  const tabs: { key: DiscoverTab; emoji: string; label: string }[] = [
    { key: "eat", emoji: "\u{1F37D}\uFE0F", label: "Eat Out" },
    { key: "grocers", emoji: "\u{1F6D2}", label: "Grocers" },
    { key: "attractions", emoji: "\u{1F5FA}\uFE0F", label: "Attractions" },
  ];

  const panelLeft = (sidebarWidth ?? 310) + 20;

  return (
    <GlassPanel className="absolute top-4 bottom-4 w-[310px] z-20 flex flex-col overflow-hidden" style={{ left: `${panelLeft}px` }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => toggleDiscover(tab.key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                discoverTab === tab.key
                  ? dark ? "bg-white/15 text-white" : "bg-black/10 text-zinc-900"
                  : dark ? "text-zinc-400 hover:bg-white/5" : "text-zinc-500 hover:bg-black/5"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={closeDiscover}
          className={`p-1 rounded-lg transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search near + filter */}
      <div className="px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium flex-shrink-0 ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
            Search near:
          </span>
          <select
            value={nearPinId}
            onChange={(e) => setNearPinId(e.target.value === "trip-center" ? "trip-center" : Number(e.target.value))}
            className={`flex-1 min-w-0 text-xs px-2 py-1.5 rounded-lg outline-none truncate ${
              dark ? "bg-white/10 text-white" : "bg-black/5 text-zinc-900"
            }`}
          >
            <option value="trip-center">{trip.destination || "Trip center"}</option>
            {allPins.map((pin) => (
              <option key={pin.id} value={pin.id}>{pin.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-1.5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Filter by name..."
            className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-colors ${
              dark ? "bg-white/10 placeholder:text-zinc-500 focus:bg-white/15" : "bg-black/5 placeholder:text-zinc-400 focus:bg-black/[.08]"
            }`}
          />
          <button
            onClick={handleSearch}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              dark ? "bg-white/10 text-white hover:bg-white/15" : "bg-black/5 text-zinc-700 hover:bg-black/10"
            }`}
          >
            Search
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: day?.color }} />
            <span className={`text-xs ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
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
        {loading && (
          <div className={`text-center py-8 text-sm ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Searching nearby places...
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className={`text-center py-8 text-sm ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
            No places found nearby. Try a different location or search term.
          </div>
        )}

        {!loading && results.map((result) => (
          <ResultItem
            key={result.id}
            result={result}
            tab={discoverTab}
            added={isAdded(result)}
            onAdd={() => handleAdd(result)}
            dayDate={dayDate}
          />
        ))}
      </div>
    </GlassPanel>
  );
}
