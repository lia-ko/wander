import { toastHttpError, toastNetworkError } from "./apiError";

export type GeoResult = {
  placeId: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
};

function parseResults(data: Record<string, string>[]): GeoResult[] {
  return data.map((item) => ({
    placeId: item.place_id,
    name: item.display_name?.split(",")[0] ?? item.name,
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    type: item.type,
  }));
}

// Serialize Nominatim requests to enforce 1s spacing (race-safe)
let throttleQueue: Promise<void> = Promise.resolve();

async function throttledFetch(url: string, signal?: AbortSignal): Promise<Response> {
  let release: () => void;
  const prev = throttleQueue;
  throttleQueue = new Promise((r) => { release = r; });
  await prev;
  try {
    return await fetch(url, signal ? { signal } : undefined);
  } finally {
    // Enforce 1.1s gap before next request can proceed
    setTimeout(() => release!(), 1100);
  }
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  if (!query.trim() || query.length < 2) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({
        q: query,
        format: "json",
        limit: "6",
        featuretype: "city",
        addressdetails: "1",
      });
    const res = await throttledFetch(url, signal);
    if (!res.ok) {
      toastHttpError(res, "City search failed");
      return [];
    }
    const data = await res.json();
    return parseResults(data);
  } catch (err) {
    toastNetworkError(err, "City search failed");
    return [];
  }
}

/** Haversine distance in km */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export async function searchNearby(
  query: string,
  center: { lat: number; lng: number },
  radiusDeg = 0.015, // ~1.5km default
  maxDistKm = 10,
  signal?: AbortSignal,
): Promise<GeoResult[]> {
  if (!center.lat && !center.lng) return [];
  const searchQuery = query.trim();
  if (!searchQuery) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({
        q: searchQuery,
        format: "json",
        limit: "15",
        viewbox: `${center.lng - radiusDeg},${center.lat + radiusDeg},${center.lng + radiusDeg},${center.lat - radiusDeg}`,
        bounded: "1",
        addressdetails: "1",
      });
    const res = await throttledFetch(url, signal);
    if (!res.ok) {
      toastHttpError(res, "Place search failed");
      return [];
    }
    let data = await res.json();

    // If tight search returns too few, widen
    if (data.length < 3) {
      const wider = radiusDeg * 4;
      const widerUrl = `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: searchQuery,
          format: "json",
          limit: "15",
          viewbox: `${center.lng - wider},${center.lat + wider},${center.lng + wider},${center.lat - wider}`,
          bounded: "1",
          addressdetails: "1",
        });
      const widerRes = await throttledFetch(widerUrl, signal);
      if (widerRes.ok) {
        const widerData = await widerRes.json();
        if (widerData.length > data.length) data = widerData;
      }
    }

    // Parse, filter by max distance, sort by distance
    return parseResults(data)
      .map((r) => ({ ...r, _dist: distanceKm(center, { lat: r.lat, lng: r.lng }) }))
      .filter((r) => r._dist <= maxDistKm)
      .sort((a, b) => a._dist - b._dist);
  } catch (err) {
    toastNetworkError(err, "Place search failed");
    return [];
  }
}

export async function searchPlaces(query: string, center: { lat: number; lng: number }, signal?: AbortSignal): Promise<GeoResult[]> {
  if (!query.trim() || query.length < 2) return [];

  try {
    // Tight search: ~55km around trip center
    const url = `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({
        q: query,
        format: "json",
        limit: "6",
        viewbox: `${center.lng - 0.5},${center.lat + 0.5},${center.lng + 0.5},${center.lat - 0.5}`,
        bounded: "1",
      });
    const res = await throttledFetch(url, signal);
    if (!res.ok) {
      toastHttpError(res, "Place search failed");
      return [];
    }
    const data = await res.json();
    if (data.length > 0) return parseResults(data);

    // Widen to ~220km if tight search returns nothing
    const widerUrl = `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({
        q: query,
        format: "json",
        limit: "6",
        viewbox: `${center.lng - 2},${center.lat + 2},${center.lng + 2},${center.lat - 2}`,
        bounded: "1",
      });
    const widerRes = await throttledFetch(widerUrl, signal);
    if (!widerRes.ok) {
      toastHttpError(widerRes, "Place search failed");
      return [];
    }
    const widerData = await widerRes.json();
    return parseResults(widerData);
  } catch (err) {
    toastNetworkError(err, "Place search failed");
    return [];
  }
}
