/**
 * Export trip expenses as a CSV file (with BOM for Excel compatibility).
 */

import { EXPENSE_CATEGORY_META } from "@/store/constants";
import { getDayDate, formatDayDate } from "@/lib/hours";
import type { Expense, Trip } from "@/types";

function escape(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export function exportExpensesCsv(
  trip: Trip,
  expenses: Expense[],
  homeCurrency: string,
  toHome: (exp: Expense) => number | null,
  dayLabelMap: Map<number, string>,
) {
  // Build day date map for actual calendar dates
  const dayDateMap = new Map<number, string>();
  if (trip.startDate) {
    trip.days.forEach((d, i) => {
      const date = getDayDate(trip.startDate!, i);
      dayDateMap.set(d.id, formatDayDate(date));
    });
  }

  const header = "Name,Amount,Currency,Category,Day,Date,Note,Home Amount,Home Currency";
  const rows = expenses.map((exp) => {
    const cur = exp.currency ?? homeCurrency;
    const dayLabel = exp.dayId ? dayLabelMap.get(exp.dayId) ?? "" : "";
    const dayDate = exp.dayId ? dayDateMap.get(exp.dayId) ?? "" : "";
    const homeAmt = toHome(exp);
    return [
      escape(exp.name),
      exp.amount.toFixed(2),
      cur,
      EXPENSE_CATEGORY_META[exp.category].label,
      escape(dayLabel),
      escape(dayDate),
      escape(exp.note ?? ""),
      homeAmt !== null ? homeAmt.toFixed(2) : "",
      homeCurrency,
    ].join(",");
  });

  // Summary row
  const totalHome = expenses.reduce((s, e) => s + (toHome(e) ?? 0), 0);
  rows.push([
    escape("TOTAL"), "", "", "", "", "", "",
    totalHome.toFixed(2),
    homeCurrency,
  ].join(","));

  const csv = "\uFEFF" + [header, ...rows].join("\n"); // BOM for Excel compatibility
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${trip.name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}_expenses.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
