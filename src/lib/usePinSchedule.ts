import { getDayDate, getHoursForDate, parseTimeToMinutes, checkTimeConflict } from "@/lib/hours";
import type { Pin, Trip } from "@/types";

/**
 * Derive scheduling info for a pin on a given day:
 * - dayDate: the calendar Date for the day (or null)
 * - dayHours: human-readable hours string for that date (or null)
 * - startMins: parsed start time in minutes (or null)
 * - conflict: "closed" | "outside" | null
 */
export function getPinSchedule(
  pin: Pin,
  trip: { startDate: string | null; days: { id: number }[] },
  dayId: number,
) {
  const dayIndex = trip.days.findIndex((d) => d.id === dayId);
  const dayDate = trip.startDate ? getDayDate(trip.startDate, dayIndex) : null;
  const dayHours = pin.openingHours && dayDate
    ? getHoursForDate(pin.openingHours, dayDate)
    : null;
  const startMins = parseTimeToMinutes(pin.startTime);
  const conflict = startMins !== null
    ? checkTimeConflict(startMins, pin.openingHours, dayDate)
    : null;
  return { dayDate, dayHours, startMins, conflict };
}
