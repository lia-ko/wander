"use client";

import { useState, useRef, useEffect } from "react";
import { useTripStore } from "@/store/tripStore";
import { EXPENSE_CATEGORY_META } from "@/store/constants";
import { fmtAmt } from "@/lib/formatUtils";
import { textMuted, textStrong, textSubtle, ghostBtn } from "@/lib/styles";
import type { ExpenseCategory } from "@/types";

function CatLimitInput({ cat, label, defaultValue, homeSymbol, dark, onChange }: {
  cat: ExpenseCategory;
  label: string;
  defaultValue: number | undefined;
  homeSymbol: string;
  dark: boolean;
  onChange: (cat: ExpenseCategory, value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 ml-4">
      <span className={`text-[10px] ${textSubtle(dark)}`}>Limit:</span>
      <div className="flex items-center gap-0.5">
        <span className={`text-[10px] ${textSubtle(dark)}`}>{homeSymbol}</span>
        <input
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

const categories = Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[];

export default function CategoryBreakdown({
  byCategory,
  catLimits,
  totalSpent,
  homeSymbol,
  dark,
}: {
  byCategory: Array<{ cat: ExpenseCategory; label: string; color: string; total: number }>;
  catLimits: Partial<Record<ExpenseCategory, number>>;
  totalSpent: number;
  homeSymbol: string;
  dark: boolean;
}) {
  const setBudget = useTripStore((s) => s.setBudget);
  const [showCatLimits, setShowCatLimits] = useState(false);

  const limitTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(limitTimerRef.current), []);

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

  return (
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
  );
}
