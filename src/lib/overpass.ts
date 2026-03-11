import { distanceKm } from "./geocode";
import { toastHttpError, toastNetworkError } from "./apiError";
import { OVERPASS_ENDPOINTS, DISCOVER_RADIUS, OVERPASS_MAX_RETRIES, OVERPASS_RETRY_DELAY_MS } from "./constants";

export type OverpassResult = {
  id: string;
  name: string;
  cuisine: string | null;
  address: string | null;
  lat: number;
  lng: number;
  osmType: string;       // e.g. "restaurant", "cafe", "museum"
  tags: Record<string, string>;
  dist?: number;         // distance in km from search center
};

// OSM tag sets for each discover tab
const EAT_TAGS = [
  '["amenity"="restaurant"]',
  '["amenity"="cafe"]',
  '["amenity"="fast_food"]',
  '["amenity"="bar"]',
  '["amenity"="pub"]',
  '["amenity"="ice_cream"]',
];

const GROCER_TAGS = [
  '["shop"="supermarket"]',
  '["shop"="convenience"]',
  '["shop"="bakery"]',
  '["shop"="greengrocer"]',
  '["shop"="butcher"]',
  '["shop"="deli"]',
  '["amenity"="marketplace"]',
  '["shop"="general"]',
];

const ATTRACTION_TAGS = [
  '["tourism"="museum"]',
  '["tourism"="gallery"]',
  '["tourism"="viewpoint"]',
  '["tourism"="attraction"]',
  '["tourism"="zoo"]',
  '["tourism"="aquarium"]',
  '["tourism"="theme_park"]',
  '["historic"="monument"]',
  '["historic"="memorial"]["memorial"!="stolperstein"]',
  '["historic"="castle"]',
  '["historic"="ruins"]',
  '["historic"="archaeological_site"]',
  '["historic"="fort"]',
  '["amenity"="theatre"]',
  '["amenity"="arts_centre"]',
  '["amenity"="cinema"]',
  '["leisure"="park"]["name"]',
  '["leisure"="garden"]["name"]',
  '["leisure"="stadium"]',
];

export type DiscoverCategory = "eat" | "grocers" | "attractions";

const TAG_MAP: Record<DiscoverCategory, string[]> = {
  eat: EAT_TAGS,
  grocers: GROCER_TAGS,
  attractions: ATTRACTION_TAGS,
};

const RADIUS_MAP: Record<DiscoverCategory, number> = DISCOVER_RADIUS;

function buildQuery(
  center: { lat: number; lng: number },
  category: DiscoverCategory,
  radiusM: number,
  nameFilter?: string,
): string {
  const tags = TAG_MAP[category];
  const around = `(around:${radiusM},${center.lat},${center.lng})`;

  // Build union of node+way+relation queries for each tag set
  const parts = tags.flatMap((tag) => [
    `node${tag}${around};`,
    `way${tag}${around};`,
    ...(category === "attractions" ? [`relation${tag}${around};`] : []),
  ]);

  let query = `[out:json][timeout:30];(\n${parts.join("\n")}\n);out center body qt 50;`;

  // If there's a name filter, we use a regex filter
  if (nameFilter) {
    const escaped = nameFilter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filterParts = tags.flatMap((tag) => [
      `node${tag}["name"~"${escaped}",i]${around};`,
      `way${tag}["name"~"${escaped}",i]${around};`,
      ...(category === "attractions" ? [`relation${tag}["name"~"${escaped}",i]${around};`] : []),
    ]);
    query = `[out:json][timeout:30];(\n${filterParts.join("\n")}\n);out center body qt 50;`;
  }

  return query;
}

function parseElement(el: Record<string, unknown>): OverpassResult | null {
  const tags = (el.tags as Record<string, string>) || {};
  if (!tags.name) return null; // skip unnamed POIs

  // Get coordinates — for ways, use the "center" field
  let lat: number, lng: number;
  if (el.type === "way" || el.type === "relation") {
    const center = el.center as { lat: number; lon: number } | undefined;
    if (!center) return null;
    lat = center.lat;
    lng = center.lon;
  } else {
    lat = Number(el.lat);
    lng = Number(el.lon);
  }

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

  // Build address from addr:* tags
  const addrParts: string[] = [];
  if (tags["addr:street"]) {
    addrParts.push(tags["addr:housenumber"] ? `${tags["addr:housenumber"]} ${tags["addr:street"]}` : tags["addr:street"]);
  }
  if (tags["addr:city"]) addrParts.push(tags["addr:city"]);

  // Determine type
  const osmType = tags.amenity || tags.tourism || tags.shop || tags.historic || tags.leisure || "place";

  return {
    id: `${el.type}-${el.id}`,
    name: tags.name,
    cuisine: tags.cuisine || null,
    address: addrParts.length > 0 ? addrParts.join(", ") : null,
    lat,
    lng,
    osmType,
    tags,
  };
}

export async function searchOverpass(
  center: { lat: number; lng: number },
  category: DiscoverCategory,
  nameFilter?: string,
  customRadiusM?: number,
  signal?: AbortSignal,
): Promise<OverpassResult[]> {
  if (!center.lat && !center.lng) return [];

  const radius = customRadiusM ?? RADIUS_MAP[category];
  const query = buildQuery(center, category, radius, nameFilter);

  const ENDPOINTS = OVERPASS_ENDPOINTS;
  const MAX_RETRIES = OVERPASS_MAX_RETRIES;

  try {
    let res: Response | null = null;
    let lastError: Response | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (signal?.aborted) throw new Error("aborted");

      // On retry, wait with exponential backoff
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, attempt * OVERPASS_RETRY_DELAY_MS));
        if (signal?.aborted) throw new Error("aborted");
      }

      for (const endpoint of ENDPOINTS) {
        if (signal?.aborted) throw new Error("aborted");
        try {
          res = await fetch(endpoint, {
            method: "POST",
            body: `data=${encodeURIComponent(query)}`,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            signal,
          });
          if (res.ok) break;
          lastError = res;
          res = null;
        } catch {
          if (signal?.aborted) throw new Error("aborted");
        }
      }

      // Success or non-retryable error
      if (res?.ok) break;
      const status = lastError?.status ?? 0;
      const retryable = status === 429 || status === 504 || status === 408 || status >= 500;
      if (!retryable) break;
    }

    if (!res || !res.ok) {
      const errRes = res ?? lastError;
      if (errRes) toastHttpError(errRes, "Discovery search failed");
      return [];
    }
    let data: { elements?: Record<string, unknown>[] };
    try {
      data = await res.json();
    } catch {
      toastNetworkError(new Error("Invalid JSON response"), "Discovery search failed");
      return [];
    }

    if (!data.elements) return [];

    const results: OverpassResult[] = [];
    const seen = new Set<string>(); // dedupe by name+coords

    for (const el of data.elements) {
      const parsed = parseElement(el);
      if (!parsed) continue;

      // Dedupe: skip if same name within 50m
      const dedupKey = `${parsed.name.toLowerCase()}-${Math.round(parsed.lat * 1000)}-${Math.round(parsed.lng * 1000)}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      parsed.dist = distanceKm(center, { lat: parsed.lat, lng: parsed.lng });
      results.push(parsed);
    }

    // Sort by distance
    results.sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));

    return results;
  } catch (err) {
    toastNetworkError(err, "Discovery search failed");
    return [];
  }
}
