import { CURRENCIES } from "@/store/constants";

/** Get the currency symbol for a code, falling back to the code itself. */
export function symbolFor(code: string) {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

/** Format a monetary amount with up to 2 decimal places, no trailing zeros. */
export function fmtAmt(n: number, maxDecimals = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: maxDecimals });
}

/** Format a distance in km, showing meters if < 1km. */
export function fmtDist(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Format minutes into a human-readable duration. */
export function fmtMins(mins: number) {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins} min`;
}

/** Format a date range like "Mar 5–8" or "Mar 5 – Apr 2". */
export function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const sMonth = s.toLocaleDateString("en-US", { month: "short" });
  const eMonth = e.toLocaleDateString("en-US", { month: "short" });
  if (sMonth === eMonth) {
    return `${sMonth} ${s.getDate()}\u2013${e.getDate()}`;
  }
  return `${sMonth} ${s.getDate()} \u2013 ${eMonth} ${e.getDate()}`;
}

/** Count days between two YYYY-MM-DD strings (inclusive). */
export function daysBetween(start: string, end: string): number {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}
