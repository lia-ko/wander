export type TransportKey = "walk" | "transit" | "car";

export type FoodTypeKey =
  | "restaurant" | "cafe" | "ramen" | "sushi" | "izakaya"
  | "grocer" | "konbini" | "market" | "bakery" | "street";

export type AttrTypeKey =
  | "park" | "museum" | "temple" | "gallery" | "viewpoint"
  | "historic" | "shopping" | "nature" | "entertain" | "nightlife" | "hidden";

export type PinType = "location" | "flight";

export type Pin = {
  id: number;
  name: string;
  category: string;
  note: string | null;
  transport: TransportKey | null;
  travelTime: string | null;
  x: number;
  y: number;
  pinType: PinType;

  // Food-specific
  foodType?: FoodTypeKey;
  rating?: number;
  price?: string;

  // Attraction-specific
  attrType?: AttrTypeKey;
  duration?: string;
  cost?: number | null;

  // Scheduling
  startTime?: string;         // 24h format e.g. "09:00", "14:30"

  // Wishlist priority (1 = nice, 2 = want, 3 = must-do)
  priority?: 1 | 2 | 3;

  // Hours
  openingHours?: string | null;

  // Flight-specific
  airline?: string;
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureTime?: string;
  arrivalTime?: string;
};

export type Day = {
  id: number;
  label: string;
  sublabel: string;
  color: string;
  pins: Pin[];
};

export type Hotel = {
  id: string;
  name: string;
  address: string;
  x: number;
  y: number;
  notes: string | null;
  checkIn: string | null;
  checkOut: string | null;
};

export type ExpenseCategory =
  | "food" | "transport" | "accommodation" | "activities"
  | "shopping" | "flights" | "other";

export type Expense = {
  id: number;
  name: string;
  amount: number;
  currency?: string;        // currency the expense was paid in (defaults to trip home currency)
  category: ExpenseCategory;
  dayId: number | null;
  note: string | null;
};

export type BudgetConfig = {
  currency: string;           // home currency (budget/totals shown in this)
  spendingCurrency?: string;  // local currency at destination (new expenses default to this)
  totalBudget: number | null;
  categoryLimits?: Partial<Record<ExpenseCategory, number>>;  // optional per-category budget caps
};

export type Trip = {
  id: number;
  name: string;
  emoji: string;
  dates: string;
  startDate: string | null; // ISO date string e.g. "2026-03-08"
  destination: string;
  center: { lat: number; lng: number };
  hotels: Hotel[];
  wishlist: Pin[];
  days: Day[];
  expenses: Expense[];
  budget: BudgetConfig;
};

export type FoodResult = {
  id: string;
  name: string;
  type: FoodTypeKey;
  rating: number;
  price: string;
  note: string;
  x: number;
  y: number;
};

export type AttractionResult = {
  id: string;
  name: string;
  type: AttrTypeKey;
  rating: number;
  duration: string;
  cost: number | null;
  note: string;
  suggested: boolean;
  x: number;
  y: number;
};

export type DiscoverTab = "eat" | "grocers" | "attractions";
