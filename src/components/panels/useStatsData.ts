import { useMemo } from "react";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { useRatesStore } from "@/store/ratesStore";
import { EXPENSE_CATEGORY_META } from "@/store/constants";
import { distanceKm } from "@/lib/geocode";
import { symbolFor } from "@/lib/formatUtils";
import type { ExpenseCategory, Pin, Day } from "@/types";

const expenseCategories = Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[];

function dayRouteDistance(pins: Pin[]): number {
  let dist = 0;
  for (let i = 1; i < pins.length; i++) {
    dist += distanceKm(
      { lat: pins[i - 1].y, lng: pins[i - 1].x },
      { lat: pins[i].y, lng: pins[i].x },
    );
  }
  return dist;
}

function incr(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export function useStatsData() {
  const trip = useTripStore(selectActiveTrip);
  const dark = useTripStore((s) => s.darkMode);
  const convert = useRatesStore((s) => s.convert);

  const expenses = trip.expenses ?? [];
  const budget = trip.budget ?? { currency: "USD", totalBudget: null };
  const homeCurrency = budget.currency;
  const homeSymbol = symbolFor(homeCurrency);

  const stats = useMemo(() => {
    const toHome = (amt: number, currency?: string) => {
      const from = currency ?? homeCurrency;
      if (from === homeCurrency) return amt;
      return convert(amt, from, homeCurrency) ?? 0;
    };

    const dayDistances = trip.days.map((day) => ({
      day,
      distance: dayRouteDistance(day.pins),
      stops: day.pins.length,
    }));
    const totalDistance = dayDistances.reduce((s, d) => s + d.distance, 0);
    const totalStops = dayDistances.reduce((s, d) => s + d.stops, 0);
    const wishlistCount = (trip.wishlist ?? []).length;

    const busiestByStops = dayDistances.reduce<typeof dayDistances[0] | null>(
      (best, d) => (!best || d.stops > best.stops ? d : best), null
    );

    const foodCounts = new Map<string, number>();
    const attrCounts = new Map<string, number>();
    const transportCounts = new Map<string, number>();
    for (const day of trip.days) {
      for (const pin of day.pins) {
        if (pin.foodType) incr(foodCounts, pin.foodType);
        if (pin.attrType) incr(attrCounts, pin.attrType);
        if (pin.transport) incr(transportCounts, pin.transport);
      }
    }

    let totalSpent = 0;
    const daySpendMap = new Map<number, number>();
    const catTotals = new Map<ExpenseCategory, { total: number; count: number }>();
    let topExpenseAmt = -1;
    let topExpenseIdx = -1;

    for (let i = 0; i < expenses.length; i++) {
      const e = expenses[i];
      const homeAmt = toHome(e.amount, e.currency);
      totalSpent += homeAmt;

      if (e.dayId != null) {
        daySpendMap.set(e.dayId, (daySpendMap.get(e.dayId) ?? 0) + homeAmt);
      }

      const prev = catTotals.get(e.category) ?? { total: 0, count: 0 };
      catTotals.set(e.category, { total: prev.total + homeAmt, count: prev.count + 1 });

      if (homeAmt > topExpenseAmt) {
        topExpenseAmt = homeAmt;
        topExpenseIdx = i;
      }
    }

    let biggestSpendDay: { day: Day; amount: number } | null = null;
    for (const [dayId, amt] of daySpendMap) {
      const day = trip.days.find((d) => d.id === dayId);
      if (day && (!biggestSpendDay || amt > biggestSpendDay.amount)) {
        biggestSpendDay = { day, amount: amt };
      }
    }

    const byCat = expenseCategories
      .map((cat) => ({ cat, ...EXPENSE_CATEGORY_META[cat], ...(catTotals.get(cat) ?? { total: 0, count: 0 }) }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.total - a.total);

    const avgDailySpend = trip.days.length > 0 ? totalSpent / trip.days.length : 0;
    const topExpense = topExpenseIdx >= 0 ? { expense: expenses[topExpenseIdx], homeAmt: topExpenseAmt } : null;

    return {
      totalDistance, dayDistances, totalStops, wishlistCount, busiestByStops,
      foodCounts, attrCounts, transportCounts,
      totalSpent, daySpendMap, biggestSpendDay, avgDailySpend, byCat, topExpense,
    };
  }, [trip.days, trip.wishlist, expenses, homeCurrency, convert]);

  return { trip, dark, expenses, budget, homeCurrency, homeSymbol, stats };
}
