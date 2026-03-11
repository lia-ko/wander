"use client";

import { useEffect, useState } from "react";
import { Polyline, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { fetchDayRoutes, type RouteSegment } from "@/lib/routing";
import { fmtDist, fmtMins } from "@/lib/formatUtils";
import type { TransportKey } from "@/types";

function segmentStyle(
  transport: TransportKey | null,
  color: string,
  isActive: boolean,
): L.PolylineOptions {
  const base = {
    color,
    lineCap: "round" as const,
    lineJoin: "round" as const,
  };

  if (!isActive) {
    return { ...base, weight: 1.5, opacity: 0.1, dashArray: "4 4" };
  }

  switch (transport) {
    case "car":
      return { ...base, weight: 3.5, opacity: 0.7 };
    case "transit":
      return { ...base, weight: 3, opacity: 0.6, dashArray: "2 6" };
    case "walk":
    default:
      return { ...base, weight: 2.5, opacity: 0.6, dashArray: "4 6" };
  }
}

function DayRoute({ dayId, color, pins, isActive }: {
  dayId: number;
  color: string;
  pins: Array<{ y: number; x: number; transport: TransportKey | null }>;
  isActive: boolean;
}) {
  const [segments, setSegments] = useState<RouteSegment[]>([]);

  const pinsKey = pins
    .filter((p) => p.y !== 0 && p.x !== 0)
    .map((p) => `${p.y}:${p.x}:${p.transport}`)
    .join(",");

  useEffect(() => {
    const ac = new AbortController();
    fetchDayRoutes(pins, ac.signal).then(setSegments).catch(() => { /* aborted — safe to ignore */ });
    return () => ac.abort();
  }, [pinsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (segments.length === 0) return null;

  return (
    <>
      {segments.map((seg) => {
        const hasInfo = seg.distanceKm != null || seg.timeMins != null;
        const label = [
          seg.timeMins != null ? fmtMins(seg.timeMins) : null,
          seg.distanceKm != null ? fmtDist(seg.distanceKm) : null,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <Polyline
            key={`route-${dayId}-${seg.from}-${seg.to}`}
            positions={seg.coords}
            pathOptions={segmentStyle(seg.transport, color, isActive)}
          >
            {isActive && hasInfo && (
              <Tooltip sticky className="route-tooltip">
                {label}
              </Tooltip>
            )}
          </Polyline>
        );
      })}
    </>
  );
}

export default function RouteLines() {
  const trip = useTripStore(selectActiveTrip);
  const activeDayId = useTripStore((s) => s.activeDayId);

  return (
    <>
      {trip.days.map((day) => {
        const validPins = day.pins.filter((p) => p.y !== 0 && p.x !== 0);
        if (validPins.length < 2) return null;
        return (
          <DayRoute
            key={day.id}
            dayId={day.id}
            color={day.color}
            pins={day.pins}
            isActive={day.id === activeDayId}
          />
        );
      })}
    </>
  );
}
