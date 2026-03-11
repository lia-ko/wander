"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { useRatesStore } from "@/store/ratesStore";
import { EXPENSE_CATEGORY_META, CURRENCIES } from "@/store/constants";
import { symbolFor, fmtAmt } from "@/lib/formatUtils";
import { textMuted, textSubtle, formSelect } from "@/lib/styles";
import { exportExpensesCsv } from "@/lib/csvExport";
import CategoryBreakdown from "./budget/CategoryBreakdown";
import ExpenseForm from "./budget/ExpenseForm";
import ExpenseList from "./budget/ExpenseList";
import type { ExpenseCategory, Expense } from "@/types";

const categories = Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[];

export default function BudgetPanel() {
  const trip = useTripStore(selectActiveTrip);
  const setBudget = useTripStore((s) => s.setBudget);
  const dark = useTripStore((s) => s.darkMode);

  const fetchRates = useRatesStore((s) => s.fetchRates);
  const convert = useRatesStore((s) => s.convert);
  const ratesLoading = useRatesStore((s) => s.loading);

  const [adding, setAdding] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const expenses = trip.expenses ?? [];
  const budget = trip.budget ?? { currency: "USD", totalBudget: null };
  const homeCurrency = budget.currency;
  const homeSymbol = symbolFor(homeCurrency);
  const spendingCurrency = budget.spendingCurrency ?? homeCurrency;
  const isForeignTrip = spendingCurrency !== homeCurrency;
  const catLimits = budget.categoryLimits ?? {};

  // Fetch rates for home currency + spending currency + any used foreign currencies
  const expenseCurrencyKey = useMemo(
    () => [...new Set(expenses.map((e) => e.currency).filter((c): c is string => !!c && c !== homeCurrency))].sort().join(","),
    [expenses, homeCurrency]
  );
  useEffect(() => {
    fetchRates(homeCurrency);
    if (isForeignTrip) fetchRates(spendingCurrency);
    expenseCurrencyKey.split(",").filter(Boolean).forEach((c) => fetchRates(c));
  }, [homeCurrency, spendingCurrency, isForeignTrip, expenseCurrencyKey, fetchRates]);

  const toHome = useCallback((exp: Expense): number | null => {
    const from = exp.currency ?? homeCurrency;
    if (from === homeCurrency) return exp.amount;
    return convert(exp.amount, from, homeCurrency);
  }, [homeCurrency, convert]);

  const { totalSpent, hasUnconverted } = useMemo(() => {
    let total = 0;
    let unconverted = false;
    for (const e of expenses) {
      const v = toHome(e);
      if (v === null) unconverted = true;
      else total += v;
    }
    return { totalSpent: total, hasUnconverted: unconverted };
  }, [expenses, toHome]);

  const byCategory = useMemo(() => {
    return categories.map((cat) => ({
      cat,
      ...EXPENSE_CATEGORY_META[cat],
      total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + (toHome(e) ?? 0), 0),
    }));
  }, [expenses, toHome]);

  const liveRate = isForeignTrip ? convert(1, spendingCurrency, homeCurrency) : null;
  const isLoadingRates = Object.keys(ratesLoading).length > 0;
  const dayLabelMap = useMemo(() => new Map(trip.days.map((d) => [d.id, d.label])), [trip.days]);
  const hasBudgetOrExpenses = budget.totalBudget !== null || expenses.length > 0;

  const selectClass = formSelect(dark);

  const handleFormDone = () => {
    setAdding(false);
    setEditingExpense(null);
  };

  const startEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setAdding(true);
  };

  const handleExportCsv = () => {
    exportExpensesCsv(trip, expenses, homeCurrency, toHome, dayLabelMap);
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-3">
      {/* Currency setup */}
      <div className={`rounded-xl p-2.5 flex flex-col gap-1.5 ${dark ? "bg-white/5" : "bg-zinc-50"}`}>
        <div className="flex items-center gap-1.5">
          <select
            value={homeCurrency}
            onChange={(e) => setBudget({ currency: e.target.value })}
            aria-label="Home currency"
            className={`${selectClass} flex-1 min-w-0`}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
            ))}
          </select>
          <svg className={`w-3.5 h-3.5 flex-shrink-0 ${textSubtle(dark)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <select
            value={spendingCurrency}
            onChange={(e) => setBudget({ spendingCurrency: e.target.value === homeCurrency ? undefined : e.target.value })}
            aria-label="Spending currency"
            className={`${selectClass} flex-1 min-w-0`}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
            ))}
          </select>
        </div>
        {isForeignTrip && (
          <div className={`text-[10px] text-center ${textSubtle(dark)}`}>
            {isLoadingRates ? "Fetching rate..." : liveRate !== null
              ? `1 ${spendingCurrency} = ${homeSymbol}${fmtAmt(liveRate)} ${homeCurrency}`
              : "Rate unavailable"}
          </div>
        )}
      </div>

      {/* Total budget card */}
      <div className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-zinc-50"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium ${textMuted(dark)}`}>Total Budget</span>
          <div className="flex items-center gap-1">
            <span className={`text-xs ${textMuted(dark)}`}>{homeSymbol}</span>
            <input
              type="number"
              min="0"
              placeholder="No limit"
              value={budget.totalBudget ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) { setBudget({ totalBudget: null }); return; }
                const n = Number(v);
                if (n >= 0) setBudget({ totalBudget: n });
              }}
              aria-label="Total budget amount"
              className={`w-24 text-right text-xs px-2 py-1 rounded-lg outline-none ${
                dark ? "bg-white/5 text-zinc-200 border border-white/10" : "bg-white border border-zinc-200 text-zinc-700"
              }`}
            />
          </div>
        </div>

        {hasBudgetOrExpenses ? (
          <>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-lg font-bold ${dark ? "text-zinc-100" : "text-zinc-800"}`}>
                  {homeSymbol}{fmtAmt(totalSpent)}
                </span>
                {hasUnconverted && !isLoadingRates && (
                  <span className="text-[10px] text-amber-500" title="Some expenses could not be converted">~approx</span>
                )}
              </div>
              {budget.totalBudget !== null && (
                <span className={`text-xs ${totalSpent > budget.totalBudget ? "text-red-500" : textMuted(dark)}`}>
                  / {homeSymbol}{budget.totalBudget.toLocaleString()}
                </span>
              )}
            </div>
            {budget.totalBudget !== null && (
              <div className={`h-2 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-zinc-200"}`}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (totalSpent / budget.totalBudget) * 100)}%`,
                    backgroundColor: totalSpent > budget.totalBudget ? "#EF4444" : "#22C55E",
                  }}
                />
              </div>
            )}
            {budget.totalBudget !== null && budget.totalBudget > totalSpent && trip.days.length > 0 && (
              <div className={`text-[10px] mt-1.5 text-right ${textSubtle(dark)}`}>
                {homeSymbol}{fmtAmt((budget.totalBudget - totalSpent) / trip.days.length)}/day remaining
              </div>
            )}
          </>
        ) : (
          <div className={`text-xs text-center py-2 ${textSubtle(dark)}`}>
            Set a budget or add expenses to start tracking
          </div>
        )}
      </div>

      {/* Category breakdown */}
      <CategoryBreakdown
        byCategory={byCategory}
        catLimits={catLimits}
        totalSpent={totalSpent}
        homeSymbol={homeSymbol}
        dark={dark}
      />

      {/* Add/Edit expense form */}
      {adding ? (
        <ExpenseForm
          key={editingExpense?.id ?? "new"}
          editingExpense={editingExpense}
          homeCurrency={homeCurrency}
          spendingCurrency={spendingCurrency}
          homeSymbol={homeSymbol}
          dark={dark}
          onDone={handleFormDone}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
            dark ? "bg-[#DAA520]/10 text-[#DAA520] hover:bg-[#DAA520]/20" : "bg-[#4E8098]/10 text-[#4E8098] hover:bg-[#4E8098]/15"
          }`}
        >
          + Add Expense
        </button>
      )}

      {/* Expense list */}
      <ExpenseList
        expenses={expenses}
        homeCurrency={homeCurrency}
        homeSymbol={homeSymbol}
        dark={dark}
        dayLabelMap={dayLabelMap}
        toHome={toHome}
        onEdit={startEdit}
        onExportCsv={handleExportCsv}
      />
    </div>
  );
}
