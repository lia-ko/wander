"use client";

import { memo, useState, useMemo } from "react";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { getPinBadge } from "@/lib/pinUtils";
import { textMuted, textSubtle, sectionBg, softHoverBg, ghostBtn, ghostBtnSoft, deleteBtn } from "@/lib/styles";
import { WISHLIST_DRAG_TYPE } from "./stops/types";
import type { Pin } from "@/types";
import PlaceSearch from "./PlaceSearch";

const WishlistItem = memo(function WishlistItem({ pin }: { pin: Pin }) {
  const removeFromWishlist = useTripStore((s) => s.removeFromWishlist);
  const moveWishlistToDay = useTripStore((s) => s.moveWishlistToDay);
  const updateWishlistItem = useTripStore((s) => s.updateWishlistItem);
  const trip = useTripStore(selectActiveTrip);
  const dark = useTripStore((s) => s.darkMode);
  const [showDayPicker, setShowDayPicker] = useState(false);

  const badge = getPinBadge(pin);
  const isMustDo = !!pin.mustDo;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(WISHLIST_DRAG_TYPE, JSON.stringify({ pinId: pin.id }));
        e.dataTransfer.effectAllowed = "move";
      }}
      role="listitem"
      aria-roledescription="Draggable wishlist item"
      className={`group px-3 py-2 rounded-xl mx-2 transition-colors cursor-grab active:cursor-grabbing ${
        softHoverBg(dark)
      }`}
    >
      <div className="flex items-center gap-2.5">
        {badge ? (
          <span className="w-6 h-6 flex items-center justify-center text-sm">{badge}</span>
        ) : (
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
            sectionBg(dark)
          }`}>
            <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{pin.name}</div>
          {pin.note && (
            <div className={`text-xs truncate ${textMuted(dark)}`}>
              {pin.note}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateWishlistItem(pin.id, { mustDo: !isMustDo });
          }}
          className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
            isMustDo
              ? "text-amber-400"
              : dark ? "text-zinc-600 hover:text-amber-400" : "text-zinc-300 hover:text-amber-400"
          }`}
          title={isMustDo ? "Unmark must-do" : "Mark as must-do"}
          aria-label={isMustDo ? "Unmark must-do" : "Mark as must-do"}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isMustDo ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isMustDo ? 0 : 2}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setShowDayPicker(!showDayPicker); }}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              ghostBtn(dark)
            }`}
            title="Add to day"
            aria-label={`Add ${pin.name} to a day`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removeFromWishlist(pin.id); }}
            className={`p-1.5 rounded-lg transition-colors ${
              deleteBtn(dark)
            }`}
            title="Remove"
            aria-label={`Remove ${pin.name} from wishlist`}
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
});

export default function WishlistPanel() {
  const trip = useTripStore(selectActiveTrip);
  const addToWishlist = useTripStore((s) => s.addToWishlist);
  const dark = useTripStore((s) => s.darkMode);
  const [searching, setSearching] = useState(false);

  const wishlist = trip.wishlist ?? [];

  const sorted = useMemo(() => {
    const mustDo = wishlist.filter((p) => p.mustDo);
    const rest = wishlist.filter((p) => !p.mustDo);
    if (mustDo.length === 0) return wishlist;
    return [...mustDo, ...rest];
  }, [wishlist]);

  const mustDoCount = wishlist.filter((p) => p.mustDo).length;

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
        <span className={`text-xs ${textMuted(dark)}`}>
          {wishlist.length} {wishlist.length === 1 ? "place" : "places"}
          {mustDoCount > 0 && ` · ${mustDoCount} must-do`}
        </span>
      </div>

      {/* Wishlist items */}
      {sorted.map((pin) => (
        <WishlistItem key={pin.id} pin={pin} />
      ))}

      {wishlist.length === 0 && !searching && (
        <div className={`text-center py-8 px-6 ${textSubtle(dark)}`}>
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
            ghostBtnSoft(dark)
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
