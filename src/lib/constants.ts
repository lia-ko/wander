// ── API Endpoints ──

export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
] as const;

export const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
export const VALHALLA_BASE = "https://valhalla1.openstreetmap.de";
export const EXCHANGE_RATE_BASE = "https://api.frankfurter.dev/v1/latest";

// ── Search Radii (meters) ──

/** Discover panel search radii per category */
export const DISCOVER_RADIUS = {
  eat: 2000,
  grocers: 2000,
  attractions: 3000,
} as const;

/** Opening hours name-match search radius */
export const HOURS_SEARCH_RADIUS = 300;

/** Opening hours fallback (any POI) search radius */
export const HOURS_FALLBACK_RADIUS = 200;

/** Max distance (degrees, ~500m) for matching Overpass results to pins */
export const HOURS_MATCH_THRESHOLD = 0.005;

// ── Cache Limits ──

export const ROUTE_CACHE_MAX = 100;
export const DISCOVER_CACHE_MAX = 50;

// ── Timing (ms) ──

export const NOMINATIM_THROTTLE_MS = 1100;
export const OVERPASS_RETRY_DELAY_MS = 1500;
export const OVERPASS_MAX_RETRIES = 2;

// ── Map ──

export const MAP_DEFAULT_ZOOM = 12;
export const MAP_MAX_ZOOM = 15;
export const MAP_FLY_DURATION = 0.8;
export const MAP_BOUNDS_PADDING: [number, number] = [80, 80];
