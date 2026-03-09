"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTripStore } from "@/store/tripStore";
import { ATTR_TYPE_META } from "@/store/constants";
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

function formatOsmType(osmType: string): string {
  const overrides: Record<string, string> = {
    fast_food: "Fast Food",
    ice_cream: "Ice Cream",
    arts_centre: "Arts Centre",
    theme_park: "Theme Park",
    archaeological_site: "Archaeological Site",
    wayside_shrine: "Shrine",
  };
  if (overrides[osmType]) return overrides[osmType];
  return osmType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTagPills(result: OverpassResult, tab: DiscoverTab): { label: string; color: string }[] {
  const pills: { label: string; color: string }[] = [];
  const type = formatOsmType(result.osmType);

  if (tab === "eat") {
    pills.push({ label: type, color: "#E8745A" });
    if (result.cuisine) {
      pills.push({ label: formatCuisine(result.cuisine), color: "#DAA520" });
    }
  } else if (tab === "grocers") {
    pills.push({ label: type, color: "#22C55E" });
    const brand = result.tags["brand:en"] || result.tags.brand;
    if (brand && brand.toLowerCase() !== result.name.toLowerCase()) {
      pills.push({ label: brand, color: "#3B82F6" });
    }
  } else {
    const at = mapOsmToAttrType(result);
    const meta = ATTR_TYPE_META[at];
    pills.push({ label: type, color: meta?.color || "#8B5CF6" });
    if (result.tags.fee === "no") {
      pills.push({ label: "Free", color: "#22C55E" });
    } else if (result.tags.fee === "yes") {
      pills.push({ label: "Paid Entry", color: "#F97316" });
    }
  }

  return pills;
}

function TagPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ color, backgroundColor: `${color}18` }}
    >
      {label}
    </span>
  );
}

function ResultItem({ result, tab, added, wishlisted, onAdd, onWishlist, dayDate }: {
  result: OverpassResult;
  tab: DiscoverTab;
  added: boolean;
  wishlisted: boolean;
  onAdd: () => void;
  onWishlist: () => void;
  dayDate: Date | null;
}) {
  const dark = useTripStore((s) => s.darkMode);

  const pills = getTagPills(result, tab);
  const address = result.address || "";
  const dist = result.dist ?? 0;

  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${dark ? "hover:bg-[#F5E8D8]/6" : "hover:bg-[#F0D5A8]/25"}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{result.name}</div>
        {address && (
          <div className={`text-xs truncate mt-0.5 ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{address}</div>
        )}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {pills.map((pill, i) => (
            <TagPill key={i} label={pill.label} color={pill.color} />
          ))}
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
      <div className="flex flex-col gap-1 flex-shrink-0 mt-1">
        <button
          onClick={onAdd}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
            added
              ? "bg-[#90CCB8]/25 text-[#4E8098]"
              : dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8] hover:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 text-zinc-700 hover:bg-[#4E8098]/12"
          }`}
          title="Add to day"
        >
          {added ? "\u2713" : "+"}
        </button>
        <button
          onClick={onWishlist}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            wishlisted
              ? dark ? "bg-[#DAA520]/20 text-[#DAA520]" : "bg-[#4E8098]/15 text-[#4E8098]"
              : dark ? "bg-[#F5E8D8]/10 text-zinc-500 hover:text-[#DAA520] hover:bg-[#F5E8D8]/15" : "bg-[#4E8098]/8 text-zinc-400 hover:text-[#4E8098] hover:bg-[#4E8098]/12"
          }`}
          title="Save to wishlist"
        >
          <svg className="w-3.5 h-3.5" fill={wishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
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

  // Compute the effective default: first stop of active day > first hotel > null (no valid center)
  const effectiveDefault: number | string | null =
    dayPins.length > 0 ? dayPins[0].id :
    trip.hotels.length > 0 ? trip.hotels[0].id :
    null;

  // If user hasn't explicitly picked a location, use the smart default
  const activeNearId = nearPinId !== null ? nearPinId : effectiveDefault;

  // Whether we have a usable search center
  const hasSearchCenter = activeNearId !== null;

  // Compute the calendar date for the active day (for parsing opening hours)
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
    // Abort any in-flight request before starting a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSearched(true);
    searchOverpass(center, discoverTab, nameFilter || undefined, 5000, controller.signal).then((r) => {
      if (controller.signal.aborted) return; // stale — discard
      r.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
      cacheRef.current.set(cacheKey, r);
      setResults(r);
      setLoading(false);
    });
  }, [getSearchCenter, discoverTab]);

  // Auto-search when tab/location changes; abort on cleanup
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
                  ? dark ? "bg-[#DAA520]/20 text-[#DAA520]" : "bg-[#4E8098]/15 text-[#4E8098]"
                  : dark ? "text-zinc-400 hover:bg-[#F5E8D8]/6" : "text-zinc-500 hover:bg-[#4E8098]/8"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={closeDiscover}
          className={`p-1 rounded-lg transition-colors ${dark ? "hover:bg-[#F5E8D8]/10" : "hover:bg-[#4E8098]/8"}`}
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
            value={activeNearId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setNearPinId(v === "trip-center" || v.startsWith("hotel-") ? v : Number(v));
            }}
            disabled={!hasSearchCenter}
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
        {!hasSearchCenter && (
          <div className={`text-center py-12 px-6 ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
            <div className="text-2xl mb-3">{"\u{1F4CD}"}</div>
            <div className="text-sm font-medium mb-1">No search location set</div>
            <div className="text-xs leading-relaxed">
              Add a hotel/base or a stop to your day first, then come back to discover nearby places.
            </div>
          </div>
        )}

        {hasSearchCenter && loading && (
          <div className={`text-center py-8 text-sm ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Searching nearby places...
          </div>
        )}

        {hasSearchCenter && !loading && searched && results.length === 0 && (
          <div className={`text-center py-8 text-sm ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
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
