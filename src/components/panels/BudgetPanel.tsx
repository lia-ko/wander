"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { useRatesStore } from "@/store/ratesStore";
import { EXPENSE_CATEGORY_META, CURRENCIES } from "@/store/constants";
import { getDayDate, formatDayDate } from "@/lib/hours";
import { symbolFor, fmtAmt } from "@/lib/formatUtils";
import { textMuted, textSubtle, textStrong, formInputBordered, formSelect, ghostBtn } from "@/lib/styles";
import type { ExpenseCategory, Expense, Trip } from "@/types";

const categories = Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[];

type SortKey = "newest" | "oldest" | "amount" | "category" | "day";

function exportExpensesCsv(
  trip: Trip,
  expenses: Expense[],
  homeCurrency: string,
  toHome: (exp: Expense) => number | null,
  dayLabelMap: Map<number, string>,
) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;

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

export default function BudgetPanel() {
  const trip = useTripStore(selectActiveTrip);
  const setBudget = useTripStore((s) => s.setBudget);
  const addExpense = useTripStore((s) => s.addExpense);
  const updateExpense = useTripStore((s) => s.updateExpense);
  const removeExpense = useTripStore((s) => s.removeExpense);
  const clearAllExpenses = useTripStore((s) => s.clearAllExpenses);
  const dark = useTripStore((s) => s.darkMode);

  const fetchRates = useRatesStore((s) => s.fetchRates);
  const convert = useRatesStore((s) => s.convert);
  const rates = useRatesStore((s) => s.rates);
  const ratesLoading = useRatesStore((s) => s.loading);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [note, setNote] = useState("");
  const [dayId, setDayId] = useState<number | null>(null);
  const [expCurrency, setExpCurrency] = useState("");
  const [showCatLimits, setShowCatLimits] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [confirmClear, setConfirmClear] = useState(false);
  const [csvExported, setCsvExported] = useState(false);

  // Debounce ref for category limit inputs
  const limitTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  /** Convert an expense amount to home currency. Returns null if rate unavailable. */
  const toHome = useCallback((exp: Expense): number | null => {
    const from = exp.currency ?? homeCurrency;
    if (from === homeCurrency) return exp.amount;
    return convert(exp.amount, from, homeCurrency);
  }, [homeCurrency, convert, rates]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Live rate display
  const liveRate = isForeignTrip ? convert(1, spendingCurrency, homeCurrency) : null;

  const resetForm = () => {
    setName("");
    setAmount("");
    setCategory("food");
    setNote("");
    setDayId(null);
    setExpCurrency(spendingCurrency);
    setAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    const cur = expCurrency || spendingCurrency;
    if (editingId !== null) {
      updateExpense(editingId, {
        name: name.trim(), amount: amt, category,
        note: note.trim() || null, dayId,
        currency: cur !== homeCurrency ? cur : undefined,
      });
    } else {
      addExpense({
        name: name.trim(), amount: amt, category,
        note: note.trim() || null, dayId,
        currency: cur !== homeCurrency ? cur : undefined,
      });
    }
    resetForm();
  };

  const startEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setName(exp.name);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setNote(exp.note ?? "");
    setDayId(exp.dayId);
    setExpCurrency(exp.currency ?? homeCurrency);
    setAdding(true);
  };

  const handleCatLimitChange = (cat: ExpenseCategory, value: string) => {
    clearTimeout(limitTimerRef.current);
    limitTimerRef.current = setTimeout(() => {
      const newLimits = { ...catLimits };
      if (!value) { delete newLimits[cat]; } else {
        const n = Number(value);
        if (n >= 0) newLimits[cat] = n;
      }
      setBudget({ categoryLimits: Object.keys(newLimits).length > 0 ? newLimits : undefined });
    }, 400);
  };

  const handleExportCsv = () => {
    exportExpensesCsv(trip, expenses, homeCurrency, toHome, dayLabelMap);
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

  const inputClass = formInputBordered(dark);
  const selectClass = formSelect(dark);

  const isLoadingRates = Object.keys(ratesLoading).length > 0;
  const dayLabelMap = useMemo(() => new Map(trip.days.map((d) => [d.id, d.label])), [trip.days]);

  // Sorted expense list
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

  const hasBudgetOrExpenses = budget.totalBudget !== null || expenses.length > 0;

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-3">
      {/* Currency setup — single row */}
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

        {/* Spent total */}
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
      <div className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-zinc-50"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium ${textMuted(dark)}`}>By Category</span>
          <button
            onClick={() => setShowCatLimits((v) => !v)}
            className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${ghostBtn(dark)}`}
          >
            {showCatLimits ? "Done" : "Set limits"}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {(showCatLimits ? byCategory : byCategory.filter((c) => c.total > 0 || catLimits[c.cat] != null)).map((c) => {
            const limit = catLimits[c.cat];
            const hasLimit = limit != null && limit > 0;
            const pct = hasLimit
              ? Math.min(100, (c.total / limit) * 100)
              : totalSpent > 0 ? (c.total / totalSpent) * 100 : 0;
            const overBudget = hasLimit && c.total > limit;
            return (
              <div key={c.cat} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <span className={`text-xs flex-1 ${dark ? "text-zinc-300" : "text-zinc-600"}`}>{c.label}</span>
                  {c.total > 0 && (
                    <span className={`text-xs font-semibold ${overBudget ? "text-red-500" : textStrong(dark)}`}>
                      {homeSymbol}{fmtAmt(c.total)}
                    </span>
                  )}
                  {hasLimit && (
                    <span className={`text-[10px] ${overBudget ? "text-red-500" : textSubtle(dark)}`}>
                      / {homeSymbol}{fmtAmt(limit)}
                    </span>
                  )}
                  {!hasLimit && c.total > 0 && (
                    <span className={`text-[10px] w-8 text-right ${textSubtle(dark)}`}>
                      {Math.round(pct)}%
                    </span>
                  )}
                </div>
                {showCatLimits && (
                  <CatLimitInput
                    cat={c.cat}
                    label={c.label}
                    defaultValue={catLimits[c.cat]}
                    homeSymbol={homeSymbol}
                    dark={dark}
                    onChange={handleCatLimitChange}
                  />
                )}
                {(c.total > 0 || hasLimit) && (
                  <div className={`h-1 rounded-full overflow-hidden ml-4 ${dark ? "bg-white/5" : "bg-zinc-100"}`}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: overBudget ? "#EF4444" : c.color }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {byCategory.every((c) => c.total === 0) && !showCatLimits && Object.keys(catLimits).length === 0 && (
            <span className={`text-xs ${textSubtle(dark)}`}>No expenses yet</span>
          )}
        </div>
      </div>

      {/* Add/Edit expense form */}
      {adding ? (
        <div className={`rounded-xl p-3 flex flex-col gap-2 ${dark ? "bg-white/5" : "bg-zinc-50"}`}>
          <span className={`text-xs font-semibold ${textStrong(dark)}`}>
            {editingId !== null ? "Edit Expense" : "New Expense"}
          </span>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Expense name" className={inputClass} />
          <div className="flex gap-2">
            <div className="flex items-center gap-1 flex-1">
              <select
                value={expCurrency}
                onChange={(e) => setExpCurrency(e.target.value)}
                aria-label="Expense currency"
                className={`text-xs rounded-lg px-1.5 py-1.5 outline-none flex-shrink-0 ${
                  dark ? "bg-white/5 text-zinc-300 border border-white/10" : "bg-white border border-zinc-200 text-zinc-700"
                }`}
                style={{ width: "72px" }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label="Expense amount"
                className={inputClass}
              />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} aria-label="Expense category" className={inputClass} style={{ width: "auto" }}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{EXPENSE_CATEGORY_META[cat].label}</option>
              ))}
            </select>
          </div>
          {/* Live conversion preview */}
          {expCurrency && expCurrency !== homeCurrency && amount && !isNaN(parseFloat(amount)) && (
            <div className={`text-[10px] px-1 flex items-center gap-1 ${textSubtle(dark)}`}>
              <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {(() => {
                const converted = convert(parseFloat(amount), expCurrency, homeCurrency);
                return converted !== null
                  ? `${symbolFor(expCurrency)}${fmtAmt(parseFloat(amount))} = ~${homeSymbol}${fmtAmt(converted)}`
                  : "Fetching exchange rate...";
              })()}
            </div>
          )}
          <select
            value={dayId ?? ""}
            onChange={(e) => setDayId(e.target.value ? Number(e.target.value) : null)}
            aria-label="Assign to day"
            className={inputClass}
          >
            <option value="">No specific day</option>
            {trip.days.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
          <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Expense note" className={inputClass} />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                dark ? "bg-[#DAA520]/20 text-[#DAA520] hover:bg-[#DAA520]/30" : "bg-[#4E8098]/15 text-[#4E8098] hover:bg-[#4E8098]/25"
              }`}
            >
              {editingId !== null ? "Update" : "Add"}
            </button>
            <button
              onClick={resetForm}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                dark ? "text-zinc-400 hover:bg-white/5" : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setExpCurrency(spendingCurrency); setAdding(true); }}
          className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
            dark ? "bg-[#DAA520]/10 text-[#DAA520] hover:bg-[#DAA520]/20" : "bg-[#4E8098]/10 text-[#4E8098] hover:bg-[#4E8098]/15"
          }`}
        >
          + Add Expense
        </button>
      )}

      {/* Expense list */}
      {expenses.length > 0 && (
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
                    onClick={() => startEdit(exp)}
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
      )}
    </div>
  );
}

/** Uncontrolled input for category limits — avoids re-rendering the whole panel on every keystroke. */
function CatLimitInput({ cat, label, defaultValue, homeSymbol, dark, onChange }: {
  cat: ExpenseCategory;
  label: string;
  defaultValue: number | undefined;
  homeSymbol: string;
  dark: boolean;
  onChange: (cat: ExpenseCategory, value: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-1.5 ml-4">
      <span className={`text-[10px] ${textSubtle(dark)}`}>Limit:</span>
      <div className="flex items-center gap-0.5">
        <span className={`text-[10px] ${textSubtle(dark)}`}>{homeSymbol}</span>
        <input
          ref={ref}
          type="number"
          min="0"
          placeholder="No limit"
          defaultValue={defaultValue ?? ""}
          onChange={(e) => onChange(cat, e.target.value)}
          aria-label={`${label} budget limit`}
          className={`w-16 text-right text-[10px] px-1.5 py-0.5 rounded outline-none ${
            dark ? "bg-white/5 text-zinc-300 border border-white/10" : "bg-white border border-zinc-200 text-zinc-700"
          }`}
        />
      </div>
    </div>
  );
}
