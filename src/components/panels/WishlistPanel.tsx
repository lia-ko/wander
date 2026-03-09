"use client";

import { useState } from "react";
import { useTripStore } from "@/store/tripStore";
import { FOOD_TYPE_META, ATTR_TYPE_META } from "@/store/constants";
import type { Pin } from "@/types";
import PlaceSearch from "./PlaceSearch";

const WISHLIST_DRAG_TYPE = "application/wander-wishlist";

function WishlistItem({ pin }: { pin: Pin }) {
  const removeFromWishlist = useTripStore((s) => s.removeFromWishlist);
  const moveWishlistToDay = useTripStore((s) => s.moveWishlistToDay);
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const dark = useTripStore((s) => s.darkMode);
  const [showDayPicker, setShowDayPicker] = useState(false);

  const badge = pin.foodType && FOOD_TYPE_META[pin.foodType]
    ? FOOD_TYPE_META[pin.foodType].emoji
    : pin.attrType && ATTR_TYPE_META[pin.attrType]
      ? ATTR_TYPE_META[pin.attrType].emoji
      : null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(WISHLIST_DRAG_TYPE, JSON.stringify({ pinId: pin.id }));
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`group px-3 py-2 rounded-xl mx-2 transition-colors cursor-grab active:cursor-grabbing ${
        dark ? "hover:bg-[#F5E8D8]/6" : "hover:bg-[#F0D5A8]/25"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {badge ? (
          <span className="w-6 h-6 flex items-center justify-center text-sm">{badge}</span>
        ) : (
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
            dark ? "bg-[#F5E8D8]/10" : "bg-[#4E8098]/8"
          }`}>
            <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{pin.name}</div>
          {pin.note && (
            <div className={`text-xs truncate ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
              {pin.note}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setShowDayPicker(!showDayPicker); }}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              dark ? "text-zinc-400 hover:bg-[#F5E8D8]/10" : "text-zinc-500 hover:bg-[#4E8098]/8"
            }`}
            title="Add to day"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removeFromWishlist(pin.id); }}
            className={`p-1.5 rounded-lg transition-colors ${
              dark ? "text-zinc-500 hover:text-red-400 hover:bg-[#F5E8D8]/10" : "text-zinc-400 hover:text-red-500 hover:bg-[#4E8098]/8"
            }`}
            title="Remove"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {showDayPicker && (
        <div className="flex flex-wrap gap-1 mt-2 ml-8" onClick={(e) => e.stopPropagation()}>
          {trip.days.map((day) => (
            <button
              key={day.id}
              onClick={() => {
                moveWishlistToDay(pin.id, day.id);
                setShowDayPicker(false);
              }}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors text-white"
              style={{ backgroundColor: day.color }}
            >
              {day.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WishlistPanel() {
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const addToWishlist = useTripStore((s) => s.addToWishlist);
  const dark = useTripStore((s) => s.darkMode);
  const [searching, setSearching] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto py-1 scrollbar-hide">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 ${dark ? "text-[#DAA520]" : "text-[#4E8098]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="font-semibold text-sm">Wishlist</span>
        </div>
        <span className={`text-xs ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
          {(trip.wishlist ?? []).length} {(trip.wishlist ?? []).length === 1 ? "place" : "places"}
        </span>
      </div>

      {/* Wishlist items */}
      {(trip.wishlist ?? []).map((pin) => (
        <WishlistItem key={pin.id} pin={pin} />
      ))}

      {(trip.wishlist ?? []).length === 0 && !searching && (
        <div className={`text-center py-8 px-6 ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
          <div className="text-2xl mb-3">{"\u{1F516}"}</div>
          <div className="text-sm font-medium mb-1">No saved places yet</div>
          <div className="text-xs leading-relaxed">
            Bookmark places from Discover, or add them below. Drag them into a day when you&apos;re ready.
          </div>
        </div>
      )}

      {/* Add to wishlist */}
      {searching ? (
        <PlaceSearch
          onAdd={(name, lat, lng, displayName) => {
            const shortAddress = displayName.split(",").slice(1, 3).join(",").trim();
            addToWishlist({
              name,
              category: "Custom",
              note: shortAddress || null,
              transport: null,
              travelTime: null,
              x: lng,
              y: lat,
            });
            setSearching(false);
          }}
          onCancel={() => setSearching(false)}
        />
      ) : (
        <button
          onClick={() => setSearching(true)}
          className={`flex items-center gap-2 w-full mx-2 mt-1 px-3 py-2.5 rounded-xl text-sm transition-colors ${
            dark ? "text-zinc-400 hover:bg-[#F5E8D8]/6" : "text-zinc-400 hover:bg-[#F0D5A8]/25"
          }`}
        >
          <span className={`w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center text-xs ${
            dark ? "border-[#DAA520] text-[#DAA520]" : "border-[#4E8098] text-[#4E8098]"
          }`}>+</span>
          <span>Add a place</span>
        </button>
      )}
    </div>
  );
}

export { WISHLIST_DRAG_TYPE };
