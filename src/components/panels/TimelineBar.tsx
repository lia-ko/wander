"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { useRatesStore } from "@/store/ratesStore";
import { symbolFor, fmtAmt } from "@/lib/formatUtils";
import { batchFetchThumbnails } from "@/lib/photos";
import DayColumn from "./timeline/DayColumn";

type ViewMode = "day" | "all";

export default function TimelineBar() {
  const trip = useTripStore(selectActiveTrip);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const updatePin = useTripStore((s) => s.updatePin);
  const dark = useTripStore((s) => s.darkMode);
  const convert = useRatesStore((s) => s.convert);

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeDayRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef<Set<number>>(new Set());

  const homeCurrency = trip.budget?.currency ?? "USD";
  const homeSymbol = symbolFor(homeCurrency);
  const totalBudget = trip.budget?.totalBudget;

  // Fetch thumbnails for pins that don't have them yet
  useEffect(() => {
    const eligible = trip.days.flatMap((d) =>
      d.pins
        .filter((p) => p.thumbnail === undefined && p.name && !fetchedRef.current.has(p.id))
        .map((p) => ({ id: p.id, name: p.name, dayId: d.id }))
    );
    if (eligible.length === 0) return;

    for (const p of eligible) fetchedRef.current.add(p.id);

    const controller = new AbortController();
    batchFetchThumbnails(
      eligible.map((p) => ({ id: p.id, name: p.name })),
      controller.signal,
    ).then((thumbMap) => {
      if (controller.signal.aborted) return;
      for (const p of eligible) {
        const url = thumbMap.get(p.id) ?? null;
        updatePin(p.dayId, p.id, { thumbnail: url });
      }
    });

    return () => { controller.abort(); };
  }, [trip.days, updatePin]);

  const daySpendMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const e of trip.expenses ?? []) {
      if (e.dayId == null) continue;
      const from = e.currency ?? homeCurrency;
      const amt = from === homeCurrency ? e.amount : (convert(e.amount, from, homeCurrency) ?? 0);
      map.set(e.dayId, (map.get(e.dayId) ?? 0) + amt);
    }
    return map;
  }, [trip.expenses, homeCurrency, convert]);

  const totalSpent = useMemo(() => {
    let total = 0;
    for (const e of trip.expenses ?? []) {
      const from = e.currency ?? homeCurrency;
      total += from === homeCurrency ? e.amount : (convert(e.amount, from, homeCurrency) ?? 0);
    }
    return total;
  }, [trip.expenses, homeCurrency, convert]);

  const avgDailyBudget = totalBudget && trip.days.length > 0 ? totalBudget / trip.days.length : null;
  const isOverBudget = totalBudget ? totalSpent > totalBudget : false;

  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  useEffect(() => {
    if (viewModeRef.current === "all") {
      activeDayRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeDayId]);

  const visibleDays = useMemo(() => {
    if (viewMode === "day") return trip.days.filter((d) => d.id === activeDayId);
    return trip.days;
  }, [trip.days, activeDayId, viewMode]);

  const isDayMode = viewMode === "day";

  const btnCls = (active: boolean) =>
    `px-2 py-0.5 rounded text-[9px] font-semibold transition-colors ${
      active
        ? dark ? "bg-white/10 text-zinc-100" : "bg-zinc-200 text-zinc-800"
        : dark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
    }`;

  return (
    <div className={`w-full border-t flex flex-col ${
      dark ? "bg-[#1C1C1C] border-white/10" : "bg-white border-black/10"
    }`}>
      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-1 border-b" style={{ borderColor: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
        <div className="flex items-center gap-1">
          <button onClick={() => setViewMode("day")} className={btnCls(viewMode === "day")} aria-label="Show current day only">Day</button>
          <button onClick={() => setViewMode("all")} className={btnCls(viewMode === "all")} aria-label="Show all days">All</button>
        </div>
        <div className="flex items-center gap-2">
          {totalBudget != null && (
            <span className={`text-[9px] font-medium ${isOverBudget ? "text-red-400" : dark ? "text-zinc-500" : "text-zinc-400"}`}>
              {isOverBudget && (
                <span title="Over budget">
                  <svg className="w-2.5 h-2.5 inline mr-0.5 -mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </span>
              )}
              {homeSymbol}{fmtAmt(totalSpent, 0)} / {homeSymbol}{fmtAmt(totalBudget, 0)}
            </span>
          )}
          <span className={`text-[9px] ${dark ? "text-zinc-600" : "text-zinc-400"}`}>
            {trip.days.length} days · {trip.days.reduce((s, d) => s + d.pins.length, 0)} stops
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className={`flex ${isDayMode ? "" : "overflow-x-auto scrollbar-hide"}`}>
        {visibleDays.map((day) => {
          const dayIndex = trip.days.findIndex((d) => d.id === day.id);
          const isActive = day.id === activeDayId;
          const daySpend = daySpendMap.get(day.id) ?? 0;
          const dayBudgetWarning = avgDailyBudget ? daySpend > avgDailyBudget * 1.5 : false;
          return (
            <div key={day.id} ref={isActive ? activeDayRef : undefined} className={isDayMode ? "flex-1" : ""}>
              <DayColumn
                day={day}
                dayIndex={dayIndex}
                startDate={trip.startDate}
                isActive={isActive}
                daySpend={daySpend}
                dayBudgetWarning={dayBudgetWarning}
                homeSymbol={homeSymbol}
                dark={dark}
                fill={isDayMode}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
