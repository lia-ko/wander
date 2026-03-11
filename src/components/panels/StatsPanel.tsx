"use client";

import { EXPENSE_CATEGORY_META, FOOD_TYPE_META, ATTR_TYPE_META, TRANSPORT_META } from "@/store/constants";
import { fmtAmt, fmtDist } from "@/lib/formatUtils";
import { textMuted, textSubtle, textStrong } from "@/lib/styles";
import { useStatsData } from "./useStatsData";

/** Render a group of type pills (food, attraction, transport). */
function TypePills({ entries, metaMap, dark }: {
  entries: [string, number][];
  metaMap: Record<string, { emoji: string; label: string }>;
  dark: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([type, count]) => {
        const meta = metaMap[type];
        if (!meta) return null;
        return (
          <span
            key={type}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
              dark ? "bg-white/5 text-zinc-300" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {meta.emoji} {meta.label}
            {count > 1 && <span className={`font-semibold ${dark ? "text-zinc-200" : "text-zinc-700"}`}>{count}</span>}
          </span>
        );
      })}
    </div>
  );
}

export default function StatsPanel() {
  const { trip, dark, expenses, budget, homeSymbol, stats } = useStatsData();

  const cardClass = `rounded-xl p-3 ${dark ? "bg-white/5" : "bg-zinc-50"}`;
  const labelClass = `text-[10px] uppercase tracking-wider font-semibold ${textSubtle(dark)}`;
  const valueClass = `text-lg font-bold ${dark ? "text-zinc-100" : "text-zinc-800"}`;

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <svg className={`w-4 h-4 ${dark ? "text-[#DAA520]" : "text-[#4E8098]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className={`text-sm font-semibold ${textStrong(dark)}`}>Trip Statistics</span>
      </div>

      {/* Overview row */}
      <div className="grid grid-cols-3 gap-2">
        <div className={cardClass}>
          <div className={labelClass}>Days</div>
          <div className={valueClass}>{trip.days.length}</div>
        </div>
        <div className={cardClass}>
          <div className={labelClass}>Stops</div>
          <div className={valueClass}>{stats.totalStops}</div>
          {stats.wishlistCount > 0 && (
            <div className={`text-[10px] ${textSubtle(dark)}`}>+{stats.wishlistCount} wishlist</div>
          )}
        </div>
        <div className={cardClass}>
          <div className={labelClass}>Distance</div>
          <div className={valueClass}>{fmtDist(stats.totalDistance)}</div>
          <div className={`text-[10px] ${textSubtle(dark)}`}>route total</div>
        </div>
      </div>

      {/* Spending overview */}
      {(expenses.length > 0 || budget.totalBudget !== null) && (
        <div className={cardClass}>
          <div className={`${labelClass} mb-2`}>Spending</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className={`text-xs ${textSubtle(dark)}`}>Total spent</div>
              <div className={`text-base font-bold ${dark ? "text-zinc-100" : "text-zinc-800"}`}>
                {homeSymbol}{fmtAmt(stats.totalSpent, 0)}
              </div>
              {budget.totalBudget !== null && (
                <div className={`text-[10px] ${stats.totalSpent > budget.totalBudget ? "text-red-500" : textSubtle(dark)}`}>
                  of {homeSymbol}{fmtAmt(budget.totalBudget, 0)} budget
                </div>
              )}
            </div>
            <div>
              <div className={`text-xs ${textSubtle(dark)}`}>Avg per day</div>
              <div className={`text-base font-bold ${dark ? "text-zinc-100" : "text-zinc-800"}`}>
                {homeSymbol}{fmtAmt(stats.avgDailySpend, 0)}
              </div>
              <div className={`text-[10px] ${textSubtle(dark)}`}>
                {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Category bars */}
          {stats.byCat.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-3">
              {stats.byCat.map((c) => {
                const pct = stats.totalSpent > 0 ? (c.total / stats.totalSpent) * 100 : 0;
                return (
                  <div key={c.cat} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className={`text-[10px] flex-1 ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{c.label}</span>
                    <span className={`text-[10px] font-medium ${textStrong(dark)}`}>{homeSymbol}{fmtAmt(c.total, 0)}</span>
                    <div className={`w-12 h-1 rounded-full overflow-hidden ${dark ? "bg-white/5" : "bg-zinc-200"}`}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                    </div>
                    <span className={`text-[10px] w-7 text-right ${textSubtle(dark)}`}>{Math.round(pct)}%</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Highlights */}
          <div className={`flex flex-col gap-1 mt-3 pt-2 border-t ${dark ? "border-white/5" : "border-zinc-100"}`}>
            {stats.biggestSpendDay && (
              <div className={`text-[10px] flex items-center gap-1.5 ${textSubtle(dark)}`}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stats.biggestSpendDay.day.color }} />
                <span>Most expensive day:</span>
                <span className={textStrong(dark)}>
                  {stats.biggestSpendDay.day.label} ({homeSymbol}{fmtAmt(stats.biggestSpendDay.amount, 0)})
                </span>
              </div>
            )}
            {stats.topExpense && (
              <div className={`text-[10px] flex items-center gap-1.5 ${textSubtle(dark)}`}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EXPENSE_CATEGORY_META[stats.topExpense.expense.category].color }} />
                <span>Biggest expense:</span>
                <span className={textStrong(dark)}>
                  {stats.topExpense.expense.name} ({homeSymbol}{fmtAmt(stats.topExpense.homeAmt, 0)})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Per-day breakdown */}
      <div className={cardClass}>
        <div className={`${labelClass} mb-2`}>Per-Day Breakdown</div>
        <div className="flex flex-col gap-1.5">
          {stats.dayDistances.map(({ day, distance, stops }) => {
            const spend = stats.daySpendMap.get(day.id) ?? 0;
            const isBusiest = stats.busiestByStops?.day.id === day.id && stats.totalStops > 0;
            return (
              <div
                key={day.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                  isBusiest
                    ? dark ? "bg-white/5 ring-1 ring-white/10" : "bg-zinc-100 ring-1 ring-zinc-200"
                    : ""
                }`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: day.color }} />
                <span className={`text-xs font-medium flex-1 ${textStrong(dark)}`}>
                  {day.label}
                  {isBusiest && (
                    <span className={`ml-1 text-[9px] font-normal ${dark ? "text-[#DAA520]" : "text-[#4E8098]"}`}>busiest</span>
                  )}
                </span>
                <span className={`text-[10px] ${textSubtle(dark)}`}>{stops} stop{stops !== 1 ? "s" : ""}</span>
                <span className={`text-[10px] ${textSubtle(dark)}`}>{fmtDist(distance)}</span>
                {spend > 0 && (
                  <span className={`text-[10px] font-medium ${textStrong(dark)}`}>{homeSymbol}{fmtAmt(spend, 0)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity breakdown */}
      {(stats.foodCounts.size > 0 || stats.attrCounts.size > 0 || stats.transportCounts.size > 0) && (
        <div className={cardClass}>
          <div className={`${labelClass} mb-2`}>Activity Breakdown</div>
          <div className="flex flex-col gap-2.5">
            {stats.foodCounts.size > 0 && (
              <div>
                <div className={`text-[10px] font-medium mb-1 ${textMuted(dark)}`}>Food & Drink</div>
                <TypePills entries={[...stats.foodCounts.entries()].sort((a, b) => b[1] - a[1])} metaMap={FOOD_TYPE_META} dark={dark} />
              </div>
            )}
            {stats.attrCounts.size > 0 && (
              <div>
                <div className={`text-[10px] font-medium mb-1 ${textMuted(dark)}`}>Attractions</div>
                <TypePills entries={[...stats.attrCounts.entries()].sort((a, b) => b[1] - a[1])} metaMap={ATTR_TYPE_META} dark={dark} />
              </div>
            )}
            {stats.transportCounts.size > 0 && (
              <div>
                <div className={`text-[10px] font-medium mb-1 ${textMuted(dark)}`}>Transport</div>
                <TypePills entries={[...stats.transportCounts.entries()].sort((a, b) => b[1] - a[1])} metaMap={TRANSPORT_META} dark={dark} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.totalStops === 0 && expenses.length === 0 && (
        <div className={`${cardClass} text-center py-6`}>
          <div className={`text-xs ${textSubtle(dark)}`}>
            Add stops and expenses to see trip statistics
          </div>
        </div>
      )}
    </div>
  );
}
