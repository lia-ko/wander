"use client";

import { useState, useMemo } from "react";
import { useTripStore } from "@/store/tripStore";
import { EXPENSE_CATEGORY_META } from "@/store/constants";
import { symbolFor, fmtAmt } from "@/lib/formatUtils";
import { textMuted, textStrong, textSubtle, ghostBtn } from "@/lib/styles";
import type { Expense } from "@/types";

type SortKey = "newest" | "oldest" | "amount" | "category" | "day";

export default function ExpenseList({
  expenses,
  homeCurrency,
  homeSymbol,
  dark,
  dayLabelMap,
  toHome,
  onEdit,
  onExportCsv,
}: {
  expenses: Expense[];
  homeCurrency: string;
  homeSymbol: string;
  dark: boolean;
  dayLabelMap: Map<number, string>;
  toHome: (exp: Expense) => number | null;
  onEdit: (exp: Expense) => void;
  onExportCsv: () => void;
}) {
  const removeExpense = useTripStore((s) => s.removeExpense);
  const clearAllExpenses = useTripStore((s) => s.clearAllExpenses);

  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [confirmClear, setConfirmClear] = useState(false);
  const [csvExported, setCsvExported] = useState(false);

  const sortedExpenses = useMemo(() => {
    const arr = [...expenses];
    switch (sortKey) {
      case "newest": return arr.reverse();
      case "oldest": return arr;
      case "amount": return arr.sort((a, b) => (toHome(b) ?? b.amount) - (toHome(a) ?? a.amount));
      case "category": return arr.sort((a, b) => a.category.localeCompare(b.category));
      case "day": return arr.sort((a, b) => (a.dayId ?? Infinity) - (b.dayId ?? Infinity));
    }
  }, [expenses, sortKey, toHome]);

  const handleExportCsv = () => {
    onExportCsv();
    setCsvExported(true);
    setTimeout(() => setCsvExported(false), 2000);
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    clearAllExpenses();
    setConfirmClear(false);
  };

  if (expenses.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${textMuted(dark)}`}>
          Expenses ({expenses.length})
        </span>
        <div className="flex items-center gap-1.5">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sort expenses"
            className={`text-[10px] px-1.5 py-0.5 rounded-md outline-none ${
              dark ? "bg-white/5 text-zinc-400 border border-white/10" : "bg-white border border-zinc-200 text-zinc-500"
            }`}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="amount">Amount</option>
            <option value="category">Category</option>
            <option value="day">Day</option>
          </select>
          <button
            onClick={handleExportCsv}
            className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${ghostBtn(dark)}`}
          >
            {csvExported ? "Exported!" : "Export CSV"}
          </button>
          <button
            onClick={handleClearAll}
            className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${
              confirmClear
                ? "bg-red-500/15 text-red-500 hover:bg-red-500/25"
                : dark ? "text-zinc-500 hover:text-red-400 hover:bg-red-500/10" : "text-zinc-400 hover:text-red-500 hover:bg-red-50"
            }`}
            title={confirmClear ? "Click again to confirm" : "Clear all expenses"}
          >
            {confirmClear ? "Confirm?" : "Clear all"}
          </button>
        </div>
      </div>
      {sortedExpenses.map((exp) => {
        const meta = EXPENSE_CATEGORY_META[exp.category];
        const dayLabel = exp.dayId ? dayLabelMap.get(exp.dayId) ?? null : null;
        const expIsForeign = exp.currency && exp.currency !== homeCurrency;
        const converted = expIsForeign ? toHome(exp) : null;
        const foreignSymbol = expIsForeign ? symbolFor(exp.currency ?? homeCurrency) : null;

        return (
          <div
            key={exp.id}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg group transition-colors ${
              dark ? "hover:bg-white/5" : "hover:bg-zinc-50"
            }`}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-medium truncate ${textStrong(dark)}`}>{exp.name}</div>
              <div className={`text-[10px] flex items-center gap-1 ${textSubtle(dark)}`}>
                <span>{meta.label}</span>
                {dayLabel && <><span>·</span><span>{dayLabel}</span></>}
                {exp.note && <><span>·</span><span className="truncate">{exp.note}</span></>}
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              {expIsForeign ? (
                <>
                  <span className={`text-[10px] ${textMuted(dark)}`}>
                    {foreignSymbol}{fmtAmt(exp.amount)}
                  </span>
                  <span className={`text-xs font-semibold ${textStrong(dark)}`}>
                    {converted !== null ? `${homeSymbol}${fmtAmt(converted)}` : "..."}
                  </span>
                </>
              ) : (
                <span className={`text-xs font-semibold ${textStrong(dark)}`}>
                  {homeSymbol}{fmtAmt(exp.amount)}
                </span>
              )}
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(exp)}
                aria-label={`Edit ${exp.name}`}
                className={`p-1 rounded ${dark ? "hover:bg-white/10 text-zinc-400" : "hover:bg-zinc-200 text-zinc-500"}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => removeExpense(exp.id)}
                aria-label={`Delete ${exp.name}`}
                className={`p-1 rounded ${dark ? "hover:bg-red-500/20 text-zinc-400" : "hover:bg-red-50 text-zinc-500"}`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
