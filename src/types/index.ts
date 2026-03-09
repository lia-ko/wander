export type TransportKey = "walk" | "transit" | "car";

export type FoodTypeKey =
  | "restaurant" | "cafe" | "ramen" | "sushi" | "izakaya"
  | "grocer" | "konbini" | "market" | "bakery" | "street";

export type AttrTypeKey =
  | "park" | "museum" | "temple" | "gallery" | "viewpoint"
  | "historic" | "shopping" | "nature" | "entertain" | "nightlife" | "hidden";

export type Pin = {
  id: number;
  name: string;
  category: string;
  note: string | null;
  transport: TransportKey | null;
  travelTime: string | null;
  x: number;
  y: number;

  // Food-specific
  foodType?: FoodTypeKey;
  rating?: number;
  price?: string;

  // Attraction-specific
  attrType?: AttrTypeKey;
  duration?: string;
  cost?: number | null;

  // Hours
  openingHours?: string | null;
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
  days: Day[];
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
