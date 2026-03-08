/**
 * Parse OSM opening_hours for a specific date and return human-readable hours.
 * Handles common formats: "Mo-Fr 10:00-18:00; Sa 10:00-17:00; Su 12:00-17:00"
 */

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
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
    while (true) {
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
 * Fetch opening_hours for a POI from Overpass by coordinates.
 * Tries name-matched search first (200m), then falls back to nearest POI with hours (100m).
 */
export async function fetchOpeningHours(lat: number, lng: number, name: string): Promise<string | null> {
  async function tryQuery(query: string): Promise<string | null> {
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
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
    node["name"~"${escaped}",i]["opening_hours"](around:300,${lat},${lng});
    way["name"~"${escaped}",i]["opening_hours"](around:300,${lat},${lng});
    relation["name"~"${escaped}",i]["opening_hours"](around:300,${lat},${lng});
    node["name:en"~"${escaped}",i]["opening_hours"](around:300,${lat},${lng});
    way["name:en"~"${escaped}",i]["opening_hours"](around:300,${lat},${lng});
    relation["name:en"~"${escaped}",i]["opening_hours"](around:300,${lat},${lng});
  );out body qt 1;`;
  const result = await tryQuery(nameQuery);
  if (result) return result;

  // Try 2: Any named POI with opening_hours within 200m (closest match)
  const nearbyQuery = `[out:json][timeout:10];(
    node["name"]["opening_hours"](around:200,${lat},${lng});
    way["name"]["opening_hours"](around:200,${lat},${lng});
  );out body qt 1;`;
  return tryQuery(nearbyQuery);
}
