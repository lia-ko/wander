import type { TransportKey, FoodTypeKey, AttrTypeKey } from "@/types";

export const DAY_COLORS = ["#E8845A", "#5A8FE8", "#5ABD8C", "#B87FE8", "#E85A7A", "#5AE8D4", "#E8D45A", "#8C5AE8"];

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

export const HOTEL_COLOR = "#C9A227";
