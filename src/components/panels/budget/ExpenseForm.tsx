"use client";

import { useState } from "react";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { useRatesStore } from "@/store/ratesStore";
import { EXPENSE_CATEGORY_META, CURRENCIES } from "@/store/constants";
import { symbolFor, fmtAmt } from "@/lib/formatUtils";
import { textStrong, textSubtle, formInputBordered } from "@/lib/styles";
import type { ExpenseCategory, Expense } from "@/types";

const categories = Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[];

export default function ExpenseForm({
  editingExpense,
  homeCurrency,
  spendingCurrency,
  homeSymbol,
  dark,
  onDone,
}: {
  editingExpense: Expense | null;
  homeCurrency: string;
  spendingCurrency: string;
  homeSymbol: string;
  dark: boolean;
  onDone: () => void;
}) {
  const trip = useTripStore(selectActiveTrip);
  const addExpense = useTripStore((s) => s.addExpense);
  const updateExpense = useTripStore((s) => s.updateExpense);
  const convert = useRatesStore((s) => s.convert);

  const [name, setName] = useState(editingExpense?.name ?? "");
  const [amount, setAmount] = useState(editingExpense ? String(editingExpense.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(editingExpense?.category ?? "food");
  const [note, setNote] = useState(editingExpense?.note ?? "");
  const [dayId, setDayId] = useState<number | null>(editingExpense?.dayId ?? null);
  const [expCurrency, setExpCurrency] = useState(editingExpense?.currency ?? spendingCurrency);

  const inputClass = formInputBordered(dark);
  const isEditing = editingExpense !== null;

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    const cur = expCurrency || spendingCurrency;
    const payload = {
      name: name.trim(), amount: amt, category,
      note: note.trim() || null, dayId,
      currency: cur !== homeCurrency ? cur : undefined,
    };
    if (isEditing) {
      updateExpense(editingExpense.id, payload);
    } else {
      addExpense(payload);
    }
    onDone();
  };

  return (
    <div className={`rounded-xl p-3 flex flex-col gap-2 ${dark ? "bg-white/5" : "bg-zinc-50"}`}>
      <span className={`text-xs font-semibold ${textStrong(dark)}`}>
        {isEditing ? "Edit Expense" : "New Expense"}
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
          {isEditing ? "Update" : "Add"}
        </button>
        <button
          onClick={onDone}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
            dark ? "text-zinc-400 hover:bg-white/5" : "text-zinc-500 hover:bg-zinc-100"
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
