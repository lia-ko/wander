import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTripStore, selectActiveTrip, selectActiveDay } from "@/store/tripStore";
import { useUIStore } from "@/store/uiStore";
import { searchOverpass, type OverpassResult } from "@/lib/overpass";
import { getDayDate } from "@/lib/hours";
import { DISCOVER_CACHE_MAX } from "@/lib/constants";
import { isSameLocation } from "@/lib/styles";
import type { DiscoverTab, Pin } from "@/types";
import { mapOsmToFoodType, mapOsmToAttrType, formatCuisine, formatOsmType, formatDist } from "./helpers";

export function useDiscoverSearch() {
  const discoverOpen = useUIStore((s) => s.discoverOpen);
  const discoverTab = useUIStore((s) => s.discoverTab);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const addPin = useTripStore((s) => s.addPin);
  const addToWishlist = useTripStore((s) => s.addToWishlist);
  const trip = useTripStore(selectActiveTrip);
  const day = useTripStore(selectActiveDay);

  const [searchQuery, setSearchQuery] = useState("");
  const [nearPinId, setNearPinId] = useState<number | "trip-center" | string | null>(null);
  const [results, setResults] = useState<OverpassResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const cacheRef = useRef<Map<string, OverpassResult[]>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const allPins = useMemo<Pin[]>(() => trip.days.flatMap((d) => d.pins).filter((p) => p.y !== 0 && p.x !== 0), [trip.days]);
  const dayPins = useMemo<Pin[]>(() => (day?.pins ?? []).filter((p) => p.y !== 0 && p.x !== 0), [day?.pins]);

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
    if (!center || !isFinite(center.lat) || !isFinite(center.lng)) return;
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
    searchOverpass(center, discoverTab, nameFilter || undefined, undefined, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      r.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
      if (r.length > 0) {
        if (cacheRef.current.size >= DISCOVER_CACHE_MAX) {
          const oldest = cacheRef.current.keys().next().value;
          if (oldest !== undefined) cacheRef.current.delete(oldest);
        }
        cacheRef.current.set(cacheKey, r);
      }
      setResults(r);
      setLoading(false);
    }).catch(() => {
      if (controller.signal.aborted) return;
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
    return day.pins.some((p) => isSameLocation(p.y, p.x, result.lat, result.lng));
  };

  const isWishlisted = (result: OverpassResult) => {
    return (trip.wishlist ?? []).some((p) => isSameLocation(p.y, p.x, result.lat, result.lng));
  };

  const buildPinData = (result: OverpassResult) => {
    const isFood = discoverTab === "eat" || discoverTab === "grocers";
    const foodType = isFood ? mapOsmToFoodType(result) : undefined;
    const attrType = !isFood ? mapOsmToAttrType(result) : undefined;
    const cuisine = result.cuisine ? formatCuisine(result.cuisine) : null;

    const parts: string[] = [];
    parts.push(formatOsmType(result.osmType));
    if (cuisine) parts.push(cuisine);
    if (discoverTab === "grocers") {
      const brand = result.tags["brand:en"] || result.tags.brand;
      if (brand && brand.toLowerCase() !== result.name.toLowerCase()) parts.push(brand);
    }
    if (result.tags.fee === "no") parts.push("Free");
    else if (result.tags.fee === "yes") parts.push("Paid entry");
    if (result.dist != null) parts.push(formatDist(result.dist));
    if (result.address) parts.push(result.address);

    return {
      name: result.name,
      category: isFood ? "Food" : "Attraction",
      note: parts.join(" · ") || null,
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

  return {
    // State
    trip, day, discoverTab, discoverOpen, dayDate,
    searchQuery, setSearchQuery, nearPinId: activeNearId, setNearPinId,
    results, loading, searched, hasSearchCenter,
    allPins, dayPins,
    // Actions
    handleSearch, handleAdd, handleWishlist, isAdded, isWishlisted,
  };
}
