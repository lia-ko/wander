/**
 * Fetch real road-following routes via Valhalla (free OSM instance, no API key).
 * Uses pedestrian/auto/bicycle profiles for realistic human routes
 * through sidewalks, parks, and small streets.
 */
import { VALHALLA_BASE, ROUTE_CACHE_MAX } from "./constants";
import type { TransportKey } from "@/types";

export type RouteSegment = {
  from: number; // pin index
  to: number;
  coords: [number, number][]; // [lat, lng]
  transport: TransportKey | null;
  distanceKm: number | null;  // route distance in km
  timeMins: number | null;    // travel time in minutes
};

type CachedSegment = {
  coords: [number, number][];
  distanceKm: number | null;
  timeMins: number | null;
};

const routeCache = new Map<string, CachedSegment>();

function cacheSet(key: string, value: CachedSegment) {
  if (routeCache.size >= ROUTE_CACHE_MAX) {
    // Evict oldest entry
    const oldest = routeCache.keys().next().value;
    if (oldest !== undefined) routeCache.delete(oldest);
  }
  routeCache.set(key, value);
}

function valhallaCosting(transport: TransportKey | null): string {
  switch (transport) {
    case "car":
      return "auto";
    case "transit":
      return "auto"; // Valhalla transit needs GTFS data; approximate with auto
    case "walk":
    default:
      return "pedestrian";
  }
}

/**
 * Decode an encoded polyline (precision 6 for Valhalla) into lat/lng pairs.
 */
function decodePolyline(encoded: string, precision = 6): [number, number][] {
  const factor = Math.pow(10, precision);
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat / factor, lng / factor]);
  }

  return points;
}

/**
 * Fetch a single route segment between two points via Valhalla.
 */
async function fetchSegment(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  transport: TransportKey | null,
  signal?: AbortSignal,
): Promise<CachedSegment> {
  const costing = valhallaCosting(transport);
  const cacheKey = `${costing}:${fromLat},${fromLng}-${toLat},${toLng}`;

  const cached = routeCache.get(cacheKey);
  if (cached) return cached;

  const fallback: CachedSegment = {
    coords: [[fromLat, fromLng], [toLat, toLng]],
    distanceKm: null,
    timeMins: null,
  };

  try {
    const body = JSON.stringify({
      locations: [
        { lat: fromLat, lon: fromLng },
        { lat: toLat, lon: toLng },
      ],
      costing,
      directions_options: { units: "km" },
    });

    const res = await fetch(`${VALHALLA_BASE}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal,
    });

    if (!res.ok) {
      cacheSet(cacheKey, fallback);
      return fallback;
    }

    const data = await res.json();
    const leg = data.trip?.legs?.[0];
    const shape = leg?.shape;
    if (!shape) {
      cacheSet(cacheKey, fallback);
      return fallback;
    }

    const summary = data.trip?.summary;
    const result: CachedSegment = {
      coords: decodePolyline(shape, 6),
      distanceKm: summary?.length ?? null,       // Valhalla returns km when units=km
      timeMins: summary?.time != null ? Math.round(summary.time / 60) : null, // seconds → minutes
    };
    cacheSet(cacheKey, result);
    return result;
  } catch {
    // Non-critical: fall back to straight line between points.
    // Individual segment failures are expected (rate limits, unsupported regions).
    if (!signal?.aborted) {
      cacheSet(cacheKey, fallback);
    }
    return fallback;
  }
}

/**
 * Fetch route segments for all consecutive pin pairs in a day.
 * Each segment uses the destination pin's transport mode.
 */
export async function fetchDayRoutes(
  pins: Array<{ y: number; x: number; transport: TransportKey | null }>,
  signal?: AbortSignal,
): Promise<RouteSegment[]> {
  const valid = pins
    .map((p, i) => ({ ...p, origIdx: i }))
    .filter((p) => p.y !== 0 && p.x !== 0);

  if (valid.length < 2) return [];

  const segments: RouteSegment[] = [];

  // Fetch in parallel (max 3 concurrent to be polite)
  const BATCH = 3;
  for (let i = 0; i < valid.length - 1; i += BATCH) {
    if (signal?.aborted) break;

    const batch = [];
    for (let j = i; j < Math.min(i + BATCH, valid.length - 1); j++) {
      const from = valid[j];
      const to = valid[j + 1];
      batch.push(
        fetchSegment(from.y, from.x, to.y, to.x, to.transport, signal).then(
          (result) => ({
            from: from.origIdx,
            to: to.origIdx,
            coords: result.coords,
            transport: to.transport,
            distanceKm: result.distanceKm,
            timeMins: result.timeMins,
          }),
        ),
      );
    }

    const results = await Promise.allSettled(batch);
    for (const r of results) {
      if (r.status === "fulfilled") segments.push(r.value);
    }
  }

  return segments;
}
