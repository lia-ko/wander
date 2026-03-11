import { create } from "zustand";
import { toast } from "@/store/toastStore";
import { EXCHANGE_RATE_BASE } from "@/lib/constants";

interface RatesState {
  // rates keyed by base currency, e.g. { "USD": { "EUR": 0.92, "JPY": 149.5 } }
  rates: Record<string, Record<string, number>>;
  loading: Record<string, boolean>;
  lastFetch: Record<string, number>;
  fetchRates: (base: string) => Promise<void>;
  convert: (amount: number, from: string, to: string) => number | null;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const useRatesStore = create<RatesState>((set, get) => ({
  rates: {},
  loading: {},
  lastFetch: {},

  fetchRates: async (base: string) => {
    // Check + set loading atomically via set() to prevent race conditions
    let shouldFetch = false;
    set((s) => {
      if (s.rates[base] && s.lastFetch[base] && Date.now() - s.lastFetch[base] < CACHE_TTL) return s;
      if (s.loading[base]) return s;
      shouldFetch = true;
      return { loading: { ...s.loading, [base]: true } };
    });
    if (!shouldFetch) return;
    try {
      const res = await fetch(`${EXCHANGE_RATE_BASE}?base=${base}`);
      if (!res.ok) {
        if (res.status === 429) toast("Exchange rate limit hit — try again shortly.");
        else toast("Could not fetch exchange rates — conversion may be unavailable.");
        throw new Error("Failed to fetch rates");
      }
      const data = await res.json();
      if (!data.rates || typeof data.rates !== "object") throw new Error("Invalid rates response");
      // Validate every rate is a finite positive number
      const newRates: Record<string, number> = {};
      for (const [key, val] of Object.entries(data.rates)) {
        if (typeof val === "number" && isFinite(val) && val > 0) newRates[key] = val;
      }
      // Add self-rate
      newRates[base] = 1;
      set((s) => {
        const { [base]: _, ...restLoading } = s.loading;
        return {
          rates: { ...s.rates, [base]: newRates },
          loading: restLoading,
          lastFetch: { ...s.lastFetch, [base]: Date.now() },
        };
      });
    } catch {
      set((s) => {
        const { [base]: _, ...restLoading } = s.loading;
        return { loading: restLoading };
      });
    }
  },

  convert: (amount: number, from: string, to: string) => {
    if (from === to) return amount;
    const { rates } = get();
    // Direct rate from base=from
    if (rates[from]?.[to]) return amount * rates[from][to];
    // Reverse: if we have base=to, invert
    if (rates[to]?.[from]) return amount / rates[to][from];
    return null;
  },
}));
