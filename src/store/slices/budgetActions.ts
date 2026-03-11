import type { Expense, BudgetConfig } from "@/types";
import type { TripState, StoreSet, StoreGet } from "../tripStore";
import { genId, mapActiveTrip, snapBeforeAction } from "../tripStore";

export function createBudgetActions(set: StoreSet, get: StoreGet) {
  return {
    setBudget: (config: Partial<BudgetConfig>) =>
      set((s) => ({
        trips: mapActiveTrip(s, (t) => ({
          ...t, budget: { ...(t.budget ?? { currency: "USD", totalBudget: null }), ...config },
        })),
      })),

    addExpense: (expense: Omit<Expense, "id">) =>
      set((s) => ({
        trips: mapActiveTrip(s, (t) => ({
          ...t, expenses: [...(t.expenses ?? []), { ...expense, id: genId() }],
        })),
      })),

    updateExpense: (expenseId: number, updates: Partial<Expense>) =>
      set((s) => ({
        trips: mapActiveTrip(s, (t) => ({
          ...t, expenses: (t.expenses ?? []).map((e) => (e.id === expenseId ? { ...e, ...updates } : e)),
        })),
      })),

    removeExpense: (expenseId: number) => {
      const trip = get().trips.find((t) => t.id === get().activeTripId);
      const expName = (trip?.expenses ?? []).find((e) => e.id === expenseId)?.name ?? "Expense";
      snapBeforeAction(get, `Removed "${expName}"`);
      set((s) => ({
        trips: mapActiveTrip(s, (t) => ({
          ...t, expenses: (t.expenses ?? []).filter((e) => e.id !== expenseId),
        })),
      }));
    },

    clearAllExpenses: () => {
      const trip = get().trips.find((t) => t.id === get().activeTripId);
      const count = (trip?.expenses ?? []).length;
      if (count === 0) return;
      snapBeforeAction(get, `Cleared ${count} expense${count > 1 ? "s" : ""}`);
      set((s) => ({
        trips: mapActiveTrip(s, (t) => ({ ...t, expenses: [] })),
      }));
    },
  };
}
