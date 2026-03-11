"use client";

import { useEffect, useRef, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";

export default function MapSync() {
  const map = useMap();
  const trip = useTripStore(selectActiveTrip);
  const activeTripId = useTripStore((s) => s.activeTripId);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const prevTripId = useRef(activeTripId);
  const prevDayId = useRef(activeDayId);
  const prevPinCount = useRef(0);

  const activeDay = trip.days.find((d) => d.id === activeDayId);
  const pinsKey = activeDay?.pins.map((p) => `${p.id}:${p.y}:${p.x}`).join(",") ?? "";
  const validPins = useMemo(
    () => activeDay?.pins.filter((p) => p.y !== 0 && p.x !== 0) ?? [],
    [pinsKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    // Trip changed — fly to trip center
    if (activeTripId !== prevTripId.current) {
      prevTripId.current = activeTripId;
      prevDayId.current = activeDayId;
      prevPinCount.current = validPins.length;
      const c = trip.center ?? { lat: 0, lng: 0 };
      map.flyTo([c.lat, c.lng], 12, { duration: 1 });
      return;
    }

    // Day changed — fit bounds to day pins or fly to trip center
    if (activeDayId !== prevDayId.current) {
      prevDayId.current = activeDayId;
      prevPinCount.current = validPins.length;
      if (validPins.length > 0) {
        const bounds = L.latLngBounds(validPins.map((p) => [p.y, p.x]));
        map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 15, duration: 0.8 });
      }
      return;
    }

    // New pin added — fly to include it
    if (validPins.length > prevPinCount.current && validPins.length > 0) {
      prevPinCount.current = validPins.length;
      if (validPins.length === 1) {
        map.flyTo([validPins[0].y, validPins[0].x], 15, { duration: 0.8 });
      } else {
        const bounds = L.latLngBounds(validPins.map((p) => [p.y, p.x]));
        map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 15, duration: 0.8 });
      }
    }

    prevPinCount.current = validPins.length;
  }, [activeTripId, activeDayId, validPins, trip.center, map]);

  return null;
}
