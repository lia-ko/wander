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
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}
