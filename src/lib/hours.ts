import { OVERPASS_ENDPOINTS, HOURS_SEARCH_RADIUS, HOURS_FALLBACK_RADIUS, HOURS_MATCH_THRESHOLD } from "./constants";

/**
 * Parse OSM opening_hours for a specific date and return human-readable hours.
 * Handles common formats: "Mo-Fr 10:00-18:00; Sa 10:00-17:00; Su 12:00-17:00"
 */

const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Map day abbreviations to indices (0=Su, 1=Mo, ..., 6=Sa)
const DAY_INDEX: Record<string, number> = {
  Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6,
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function expandDayRange(range: string): number[] {
  range = range.trim();

  // Single day like "Mo"
  if (DAY_INDEX[range] !== undefined) return [DAY_INDEX[range]];

  // Range like "Mo-Fr"
  const parts = range.split("-").map((s) => s.trim());
  if (parts.length === 2 && DAY_INDEX[parts[0]] !== undefined && DAY_INDEX[parts[1]] !== undefined) {
    const start = DAY_INDEX[parts[0]];
    const end = DAY_INDEX[parts[1]];
    const days: number[] = [];
    let i = start;
    for (let safety = 0; safety < 7; safety++) {
      days.push(i);
      if (i === end) break;
      i = (i + 1) % 7;
    }
    return days;
  }

  return [];
}

function parseDaySpecs(dayPart: string): number[] {
  // Handle comma-separated: "Mo,We,Fr" or "Mo-Fr,Su"
  const segments = dayPart.split(",");
  const days: number[] = [];
  for (const seg of segments) {
    days.push(...expandDayRange(seg.trim()));
  }
  return days;
}

export function getHoursForDate(openingHours: string, date: Date): string | null {
  if (!openingHours) return null;

  const oh = openingHours.trim();

  // Handle special cases
  if (oh === "24/7") return "Open 24 hours";
  if (oh.toLowerCase() === "closed") return "Closed";

  const dayOfWeek = date.getDay(); // 0=Sunday

  // Split by semicolons into rules
  const rules = oh.split(";").map((r) => r.trim()).filter(Boolean);

  let matchedTime: string | null = null;

  for (const rule of rules) {
    const lower = rule.toLowerCase();

    // Check for "off" / "closed" rules
    const isOff = lower.includes(" off") || lower.includes(" closed");

    // Try to split into day part and time part
    // Common patterns:
    // "Mo-Fr 10:00-18:00"
    // "Sa 10:00-17:00"
    // "Su off"
    // "PH off"  (public holidays)
    // "10:00-18:00" (applies to all days)

    // Check if rule starts with a day name
    const dayMatch = rule.match(/^([A-Za-z][a-z](?:[-,][A-Za-z][a-z])*)\s+(.*)/);

    if (dayMatch) {
      const dayPart = dayMatch[1];
      const timePart = dayMatch[2].trim();
      const days = parseDaySpecs(dayPart);

      if (days.includes(dayOfWeek)) {
        if (isOff) return `Closed on ${DAY_FULL[dayOfWeek]}s`;
        matchedTime = timePart;
      }
    } else {
      // No day specified — might be a time-only rule (applies if no specific match)
      const timeOnly = rule.match(/^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/);
      if (timeOnly && !matchedTime) {
        matchedTime = rule;
      }
    }
  }

  if (matchedTime) {
    // Clean up the time string
    return matchedTime
      .replace(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/, (_, h1, m1, h2, m2) => {
        return `${formatTime(h1, m1)} - ${formatTime(h2, m2)}`;
      });
  }

  // If no specific match, return the raw string as fallback
  return oh;
}

function formatTime(h: string, m: string): string {
  const hour = parseInt(h);
  const min = m;
  if (hour === 0) return `12:${min} AM`;
  if (hour < 12) return `${hour}:${min} AM`;
  if (hour === 12) return `12:${min} PM`;
  return `${hour - 12}:${min} PM`;
}

// ── Scheduling utilities ──

/** Convert "09:00" or "9:00" to total minutes from midnight. Returns null if invalid. */
export function parseTimeToMinutes(time: string | undefined): number | null {
  if (!time) return null;
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1]), min = parseInt(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** Convert total minutes from midnight to "9:00 AM" display format. */
export function minutesToDisplay(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = String(mins % 60).padStart(2, "0");
  if (h === 0) return `12:${m} AM`;
  if (h < 12) return `${h}:${m} AM`;
  if (h === 12) return `12:${m} PM`;
  return `${h - 12}:${m} PM`;
}

/** Convert total minutes to "HH:MM" 24h format. */
export function minutesTo24h(mins: number): string {
  const h = String(Math.floor(mins / 60) % 24).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** Parse a duration string like "1h30m", "45 min", "2h", "90min" to minutes. Returns null if unparseable. */
export function parseDurationToMinutes(duration: string | null | undefined): number | null {
  if (!duration) return null;
  const d = duration.trim().toLowerCase();

  // "1h30m", "1h 30m", "2h", "30m"
  const hm = d.match(/^(\d+)\s*h(?:\s*(\d+)\s*m(?:in)?)?$/);
  if (hm) return parseInt(hm[1]) * 60 + (hm[2] ? parseInt(hm[2]) : 0);

  // "45 min", "90min", "45m"
  const minOnly = d.match(/^(\d+)\s*m(?:in)?$/);
  if (minOnly) return parseInt(minOnly[1]);

  // "1.5h", "2.5 hours"
  const decH = d.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?$/);
  if (decH) return Math.round(parseFloat(decH[1]) * 60);

  // Plain number — assume minutes
  const plain = d.match(/^(\d+)$/);
  if (plain) return parseInt(plain[1]);

  return null;
}

/**
 * Check if a startTime (minutes from midnight) falls within the opening hours
 * for a given date. Returns:
 * - "open" if within hours
 * - "closed" if outside hours
 * - null if can't determine (no hours data, unparseable, etc.)
 */
export function checkTimeConflict(
  startMinutes: number,
  openingHours: string | null | undefined,
  date: Date | null,
): "open" | "closed" | null {
  if (!openingHours || !date) return null;

  const dayHours = getHoursForDate(openingHours, date);
  if (!dayHours) return null;

  const lower = dayHours.toLowerCase();
  if (lower.includes("closed")) return "closed";
  if (lower.includes("24 hours")) return "open";

  // Try to extract time range from the display string, e.g. "10:00 AM - 6:00 PM"
  const rangeMatch = dayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!rangeMatch) return null;

  const toMins = (h: string, m: string, ampm: string) => {
    let hour = parseInt(h);
    const min = parseInt(m);
    if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
    if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
    return hour * 60 + min;
  };

  const openMin = toMins(rangeMatch[1], rangeMatch[2], rangeMatch[3]);
  const closeMin = toMins(rangeMatch[4], rangeMatch[5], rangeMatch[6]);

  if (startMinutes >= openMin && startMinutes < closeMin) return "open";
  return "closed";
}

/** Get the date for a specific day index given the trip start date */
export function getDayDate(startDate: string, dayIndex: number): Date {
  const d = new Date(startDate + "T12:00:00"); // noon to avoid timezone issues
  d.setDate(d.getDate() + dayIndex);
  return d;
}

export function formatDayDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Batch-fetch opening_hours for multiple pins in a single Overpass query.
 * Each pin gets a name-matched search within 300m.
 * Returns a Map from pin id to opening_hours string.
 */
export async function batchFetchOpeningHours(
  pins: Array<{ id: number; lat: number; lng: number; name: string }>,
  signal?: AbortSignal
): Promise<Map<number, string>> {
  const results = new Map<number, string>();
  if (pins.length === 0) return results;

  // Build a single Overpass union query for all pins
  const unions = pins.map((p) => {
    const escaped = p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return [
      `node["name"~"${escaped}",i]["opening_hours"](around:${HOURS_SEARCH_RADIUS},${p.lat},${p.lng});`,
      `way["name"~"${escaped}",i]["opening_hours"](around:${HOURS_SEARCH_RADIUS},${p.lat},${p.lng});`,
      `node["name:en"~"${escaped}",i]["opening_hours"](around:${HOURS_SEARCH_RADIUS},${p.lat},${p.lng});`,
      `way["name:en"~"${escaped}",i]["opening_hours"](around:${HOURS_SEARCH_RADIUS},${p.lat},${p.lng});`,
    ].join("\n");
  }).join("\n");

  const query = `[out:json][timeout:15];(\n${unions}\n);out body qt;`;

  try {
    const res = await fetch(OVERPASS_ENDPOINTS[0], {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal,
    });
    if (!res.ok) return results;
    const data = await res.json();
    const elements: Array<{ lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }> = data.elements ?? [];

    // Match each result element back to the closest requesting pin
    for (const el of elements) {
      const hours = el.tags?.opening_hours;
      if (!hours) continue;
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (elLat == null || elLng == null) continue;

      let bestPin: (typeof pins)[0] | null = null;
      let bestDist = Infinity;
      for (const p of pins) {
        if (results.has(p.id)) continue; // already matched
        const dist = Math.abs(p.lat - elLat) + Math.abs(p.lng - elLng);
        if (dist < bestDist && dist < HOURS_MATCH_THRESHOLD) { // ~500m threshold
          bestDist = dist;
          bestPin = p;
        }
      }
      if (bestPin) results.set(bestPin.id, hours);
    }
  } catch {
    // Silent failure — background fetch
  }

  return results;
}

/**
 * Fetch opening_hours for a POI from Overpass by coordinates.
 * Tries name-matched search first (200m), then falls back to nearest POI with hours (100m).
 * Note: This is a background fetch so errors are silent (no toast) to avoid noise.
 */
export async function fetchOpeningHours(lat: number, lng: number, name: string): Promise<string | null> {
  async function tryQuery(query: string): Promise<string | null> {
    try {
      const res = await fetch(OVERPASS_ENDPOINTS[0], {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.elements?.[0]?.tags?.opening_hours) {
        return data.elements[0].tags.opening_hours;
      }
      return null;
    } catch {
      return null;
    }
  }

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Try 1: Name-matched (including name:en) within 300m
  const nameQuery = `[out:json][timeout:10];(
    node["name"~"${escaped}",i]["opening_hours"](around:${HOURS_SEARCH_RADIUS},${lat},${lng});
    way["name"~"${escaped}",i]["opening_hours"](around:${HOURS_SEARCH_RADIUS},${lat},${lng});
    relation["name"~"${escaped}",i]["opening_hours"](around:${HOURS_SEARCH_RADIUS},${lat},${lng});
    node["name:en"~"${escaped}",i]["opening_hours"](around:${HOURS_SEARCH_RADIUS},${lat},${lng});
    way["name:en"~"${escaped}",i]["opening_hours"](around:${HOURS_SEARCH_RADIUS},${lat},${lng});
    relation["name:en"~"${escaped}",i]["opening_hours"](around:${HOURS_SEARCH_RADIUS},${lat},${lng});
  );out body qt 1;`;
  const result = await tryQuery(nameQuery);
  if (result) return result;

  // Try 2: Any named POI with opening_hours within 200m (closest match)
  const nearbyQuery = `[out:json][timeout:10];(
    node["name"]["opening_hours"](around:${HOURS_FALLBACK_RADIUS},${lat},${lng});
    way["name"]["opening_hours"](around:${HOURS_FALLBACK_RADIUS},${lat},${lng});
  );out body qt 1;`;
  return tryQuery(nearbyQuery);
}
