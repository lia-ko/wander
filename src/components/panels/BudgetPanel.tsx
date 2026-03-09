"use client";

import { useState, useEffect } from "react";
import { useTripStore } from "@/store/tripStore";
import { useRatesStore } from "@/store/ratesStore";
import { EXPENSE_CATEGORY_META, CURRENCIES } from "@/store/constants";
import type { ExpenseCategory, Expense } from "@/types";

const categories = Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[];

function symbolFor(code: string) {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

function fmtAmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function BudgetPanel() {
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const setBudget = useTripStore((s) => s.setBudget);
  const addExpense = useTripStore((s) => s.addExpense);
  const updateExpense = useTripStore((s) => s.updateExpense);
  const removeExpense = useTripStore((s) => s.removeExpense);
  const dark = useTripStore((s) => s.darkMode);

  const fetchRates = useRatesStore((s) => s.fetchRates);
  const convert = useRatesStore((s) => s.convert);
  const ratesLoading = useRatesStore((s) => s.loading);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [note, setNote] = useState("");
  const [dayId, setDayId] = useState<number | null>(null);
  const [expCurrency, setExpCurrency] = useState("");

  const expenses = trip.expenses ?? [];
  const budget = trip.budget ?? { currency: "USD", totalBudget: null };
  const homeCurrency = budget.currency;
  const homeSymbol = symbolFor(homeCurrency);
  const spendingCurrency = budget.spendingCurrency ?? homeCurrency;
  const spendingSymbol = symbolFor(spendingCurrency);
  const isForeignTrip = spendingCurrency !== homeCurrency;

  // Fetch rates for home currency + spending currency + any used foreign currencies
  useEffect(() => {
    fetchRates(homeCurrency);
    if (isForeignTrip) fetchRates(spendingCurrency);
    const foreignCurrencies = new Set(
      expenses.map((e) => e.currency).filter((c): c is string => !!c && c !== homeCurrency)
    );
    foreignCurrencies.forEach((c) => fetchRates(c));
  }, [homeCurrency, spendingCurrency, isForeignTrip, expenses, fetchRates]);

  /** Convert an expense amount to home currency. Returns null if rate unavailable. */
  const toHome = (exp: Expense): number | null => {
    const from = exp.currency ?? homeCurrency;
    if (from === homeCurrency) return exp.amount;
    return convert(exp.amount, from, homeCurrency);
  };

  const totalSpent = expenses.reduce((sum, e) => sum + (toHome(e) ?? 0), 0);
  const hasUnconverted = expenses.some((e) => toHome(e) === null);

  const byCategory = categories.map((cat) => ({
    cat,
    ...EXPENSE_CATEGORY_META[cat],
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + (toHome(e) ?? 0), 0),
  }));

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

  const inputClass = `w-full px-2.5 py-1.5 rounded-lg text-xs outline-none ${
    dark ? "bg-white/5 text-zinc-200 border border-white/10 focus:border-[#DAA520]/40" : "bg-white border border-zinc-200 text-zinc-800 focus:border-[#4E8098]/40"
  }`;

  const selectClass = `text-xs rounded-lg px-2 py-1 outline-none ${
    dark ? "bg-white/5 text-zinc-300 border border-white/10" : "bg-white border border-zinc-200 text-zinc-700"
  }`;

  const isLoadingRates = ratesLoading.size > 0;

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-3">
      {/* Currency setup — single row */}
      <div className={`rounded-xl p-2.5 flex flex-col gap-1.5 ${dark ? "bg-white/5" : "bg-zinc-50"}`}>
        <div className="flex items-center gap-1.5">
          <select
            value={homeCurrency}
            onChange={(e) => setBudget({ currency: e.target.value })}
            className={`${selectClass} flex-1 min-w-0`}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
            ))}
          </select>
          <svg className={`w-3.5 h-3.5 flex-shrink-0 ${dark ? "text-zinc-500" : "text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <select
            value={spendingCurrency}
            onChange={(e) => setBudget({ spendingCurrency: e.target.value === homeCurrency ? undefined : e.target.value })}
            className={`${selectClass} flex-1 min-w-0`}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
            ))}
          </select>
        </div>
        {isForeignTrip && (
          <div className={`text-[10px] text-center ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
            {isLoadingRates ? "Fetching rate..." : liveRate !== null
              ? `1 ${spendingCurrency} = ${homeSymbol}${fmtAmt(liveRate)} ${homeCurrency}`
              : "Rate unavailable"}
          </div>
        )}
      </div>

      {/* Total budget card */}
      <div className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-zinc-50"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium ${dark ? "text-zinc-400" : "text-zinc-500"}`}>Total Budget</span>
          <div className="flex items-center gap-1">
            <span className={`text-xs ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{homeSymbol}</span>
            <input
              type="number"
              placeholder="No limit"
              value={budget.totalBudget ?? ""}
              onChange={(e) => setBudget({ totalBudget: e.target.value ? Number(e.target.value) : null })}
              className={`w-24 text-right text-xs px-2 py-1 rounded-lg outline-none ${
                dark ? "bg-white/5 text-zinc-200 border border-white/10" : "bg-white border border-zinc-200 text-zinc-700"
              }`}
            />
          </div>
        </div>

        {/* Spent total */}
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
            <span className={`text-xs ${totalSpent > budget.totalBudget ? "text-red-500" : dark ? "text-zinc-400" : "text-zinc-500"}`}>
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
      </div>

      {/* Category breakdown */}
      <div className={`rounded-xl p-3 ${dark ? "bg-white/5" : "bg-zinc-50"}`}>
        <span className={`text-xs font-medium ${dark ? "text-zinc-400" : "text-zinc-500"}`}>By Category</span>
        <div className="mt-2 flex flex-col gap-1.5">
          {byCategory.filter((c) => c.total > 0).map((c) => (
            <div key={c.cat} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
              <span className={`text-xs flex-1 ${dark ? "text-zinc-300" : "text-zinc-600"}`}>{c.label}</span>
              <span className={`text-xs font-semibold ${dark ? "text-zinc-200" : "text-zinc-700"}`}>
                {homeSymbol}{fmtAmt(c.total)}
              </span>
            </div>
          ))}
          {byCategory.every((c) => c.total === 0) && (
            <span className={`text-xs ${dark ? "text-zinc-500" : "text-zinc-400"}`}>No expenses yet</span>
          )}
        </div>
      </div>

      {/* Add/Edit expense form */}
      {adding ? (
        <div className={`rounded-xl p-3 flex flex-col gap-2 ${dark ? "bg-white/5" : "bg-zinc-50"}`}>
          <span className={`text-xs font-semibold ${dark ? "text-zinc-200" : "text-zinc-700"}`}>
            {editingId !== null ? "Edit Expense" : "New Expense"}
          </span>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          <div className="flex gap-2">
            <div className="flex items-center gap-1 flex-1">
              <select
                value={expCurrency}
                onChange={(e) => setExpCurrency(e.target.value)}
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
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
              />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={inputClass} style={{ width: "auto" }}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{EXPENSE_CATEGORY_META[cat].label}</option>
              ))}
            </select>
          </div>
          {/* Live conversion preview */}
          {expCurrency && expCurrency !== homeCurrency && amount && !isNaN(parseFloat(amount)) && (
            <div className={`text-[10px] px-1 flex items-center gap-1 ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
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
            className={inputClass}
          >
            <option value="">No specific day</option>
            {trip.days.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
          <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
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
          <span className={`text-xs font-medium ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
            Expenses ({expenses.length})
          </span>
          {expenses.map((exp) => {
            const meta = EXPENSE_CATEGORY_META[exp.category];
            const dayLabel = exp.dayId ? trip.days.find((d) => d.id === exp.dayId)?.label : null;
            const expIsForeign = exp.currency && exp.currency !== homeCurrency;
            const converted = expIsForeign ? toHome(exp) : null;
            const foreignSymbol = expIsForeign ? symbolFor(exp.currency!) : null;

            return (
              <div
                key={exp.id}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg group transition-colors ${
                  dark ? "hover:bg-white/5" : "hover:bg-zinc-50"
                }`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium truncate ${dark ? "text-zinc-200" : "text-zinc-700"}`}>{exp.name}</div>
                  <div className={`text-[10px] flex items-center gap-1 ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
                    <span>{meta.label}</span>
                    {dayLabel && <><span>·</span><span>{dayLabel}</span></>}
                    {exp.note && <><span>·</span><span className="truncate">{exp.note}</span></>}
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  {expIsForeign ? (
                    <>
                      <span className={`text-[10px] ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
                        {foreignSymbol}{fmtAmt(exp.amount)}
                      </span>
                      <span className={`text-xs font-semibold ${dark ? "text-zinc-200" : "text-zinc-700"}`}>
                        {converted !== null ? `${homeSymbol}${fmtAmt(converted)}` : "..."}
                      </span>
                    </>
                  ) : (
                    <span className={`text-xs font-semibold ${dark ? "text-zinc-200" : "text-zinc-700"}`}>
                      {homeSymbol}{fmtAmt(exp.amount)}
                    </span>
                  )}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(exp)}
                    className={`p-1 rounded ${dark ? "hover:bg-white/10 text-zinc-400" : "hover:bg-zinc-200 text-zinc-500"}`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeExpense(exp.id)}
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
