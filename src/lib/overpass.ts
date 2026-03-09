import { distanceKm } from "./geocode";
import { toast } from "@/store/toastStore";

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

const RADIUS_MAP: Record<DiscoverCategory, number> = {
  eat: 1500,        // 1.5km
  grocers: 1200,    // 1.2km
  attractions: 3000, // 3km
};

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

  let query = `[out:json][timeout:25];(\n${parts.join("\n")}\n);out center body qt 50;`;

  // If there's a name filter, we use a regex filter
  if (nameFilter) {
    const escaped = nameFilter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filterParts = tags.flatMap((tag) => [
      `node${tag}["name"~"${escaped}",i]${around};`,
      `way${tag}["name"~"${escaped}",i]${around};`,
      ...(category === "attractions" ? [`relation${tag}["name"~"${escaped}",i]${around};`] : []),
    ]);
    query = `[out:json][timeout:25];(\n${filterParts.join("\n")}\n);out center body qt 50;`;
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
    lat = el.lat as number;
    lng = el.lon as number;
  }

  if (!lat || !lng) return null;

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

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal,
    });

    if (!res.ok) {
      toast("Search failed — the Overpass API is unavailable. Try again shortly.");
      return [];
    }
    const data = await res.json();

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
    const msg = err instanceof Error && err.name === "AbortError"
      ? "Search timed out — try again."
      : "Search failed — check your connection and try again.";
    toast(msg);
    return [];
  }
}
