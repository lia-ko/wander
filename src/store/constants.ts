import type { TransportKey, FoodTypeKey, AttrTypeKey, ExpenseCategory } from "@/types";

// Ordered so adjacent days always have high contrast (alternating warm/cool)
export const DAY_COLORS = [
  "#E8745A", // coral
  "#4E8098", // steel blue
  "#DAA520", // goldenrod
  "#90CCB8", // teal
  "#D946EF", // magenta
  "#FF4500", // orange-red
  "#3B82F6", // blue
  "#22C55E", // green
  "#F97316", // orange
  "#8B5CF6", // purple
  "#E11D48", // rose
  "#0EA5E9", // sky blue
  "#A3E635", // lime
  "#F472B6", // pink
  "#14B8A6", // teal-dark
  "#EF4444", // red
  "#6366F1", // indigo
  "#FACC15", // yellow
  "#EC4899", // hot pink
  "#059669", // emerald
];

export const TRANSPORT_META: Record<TransportKey, { emoji: string; label: string; color: string }> = {
  walk:    { emoji: "\u{1F6B6}", label: "Walking",          color: "#6B7280" },
  transit: { emoji: "\u{1F687}", label: "Public Transit",   color: "#3B82F6" },
  car:     { emoji: "\u{1F697}", label: "Car",              color: "#EF4444" },
};

export const FOOD_TYPE_META: Record<FoodTypeKey, { emoji: string; label: string }> = {
  restaurant: { emoji: "\u{1F37D}\uFE0F", label: "Restaurant" },
  cafe:       { emoji: "\u2615",           label: "Cafe" },
  ramen:      { emoji: "\u{1F35C}",       label: "Ramen" },
  sushi:      { emoji: "\u{1F363}",       label: "Sushi" },
  izakaya:    { emoji: "\u{1F376}",       label: "Izakaya" },
  grocer:     { emoji: "\u{1F6D2}",       label: "Supermarket" },
  konbini:    { emoji: "\u{1F3EA}",       label: "Konbini" },
  market:     { emoji: "\u{1F3AA}",       label: "Market" },
  bakery:     { emoji: "\u{1F950}",       label: "Bakery" },
  street:     { emoji: "\u{1F362}",       label: "Street Food" },
};

export const ATTR_TYPE_META: Record<AttrTypeKey, { emoji: string; label: string; color: string }> = {
  park:      { emoji: "\u{1F333}",       label: "Park",         color: "#22C55E" },
  museum:    { emoji: "\u{1F3DB}\uFE0F", label: "Museum",       color: "#8B5CF6" },
  temple:    { emoji: "\u26E9\uFE0F",    label: "Temple",       color: "#EF4444" },
  gallery:   { emoji: "\u{1F5BC}\uFE0F", label: "Gallery",      color: "#EC4899" },
  viewpoint: { emoji: "\u{1F304}",       label: "Viewpoint",    color: "#F97316" },
  historic:  { emoji: "\u{1F3EF}",       label: "Historic",     color: "#A16207" },
  shopping:  { emoji: "\u{1F6CD}\uFE0F", label: "Shopping",     color: "#D946EF" },
  nature:    { emoji: "\u{1F33F}",       label: "Nature",       color: "#15803D" },
  entertain: { emoji: "\u{1F3AD}",       label: "Entertainment",color: "#E11D48" },
  nightlife: { emoji: "\u{1F378}",       label: "Nightlife",    color: "#7C3AED" },
  hidden:    { emoji: "\u{1F48E}",       label: "Hidden Gem",   color: "#0EA5E9" },
};

export const EXPENSE_CATEGORY_META: Record<ExpenseCategory, { label: string; color: string }> = {
  food:          { label: "Food & Drink",   color: "#E8745A" },
  transport:     { label: "Transport",      color: "#3B82F6" },
  accommodation: { label: "Accommodation",  color: "#DAA520" },
  activities:    { label: "Activities",     color: "#8B5CF6" },
  shopping:      { label: "Shopping",       color: "#D946EF" },
  flights:       { label: "Flights",        color: "#0EA5E9" },
  other:         { label: "Other",          color: "#6B7280" },
};

export const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "\u20AC" },
  { code: "GBP", symbol: "\u00A3" },
  { code: "JPY", symbol: "\u00A5" },
  { code: "AUD", symbol: "A$" },
  { code: "CAD", symbol: "C$" },
  { code: "CHF", symbol: "CHF" },
  { code: "SEK", symbol: "kr" },
  { code: "NOK", symbol: "kr" },
  { code: "DKK", symbol: "kr" },
  { code: "NZD", symbol: "NZ$" },
  { code: "SGD", symbol: "S$" },
  { code: "HKD", symbol: "HK$" },
  { code: "KRW", symbol: "\u20A9" },
  { code: "THB", symbol: "\u0E3F" },
  { code: "MXN", symbol: "MX$" },
  { code: "BRL", symbol: "R$" },
  { code: "INR", symbol: "\u20B9" },
  { code: "ILS", symbol: "\u20AA" },
  { code: "TRY", symbol: "\u20BA" },
];

export const HOTEL_COLOR = "#DAA520";
