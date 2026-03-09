"use client";

import { useState } from "react";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { useUIStore } from "@/store/uiStore";
import { STOP_DRAG_TYPE } from "./StopList";
import { WISHLIST_DRAG_TYPE } from "./WishlistPanel";

export default function DayChips() {
  const trip = useTripStore(selectActiveTrip);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const setActiveDayId = useTripStore((s) => s.setActiveDayId);
  const addDay = useTripStore((s) => s.addDay);
  const movePinToDay = useTripStore((s) => s.movePinToDay);
  const moveWishlistToDay = useTripStore((s) => s.moveWishlistToDay);
  const dark = useTripStore((s) => s.darkMode);
  const sidebarView = useUIStore((s) => s.sidebarView);

  const isWishlist = sidebarView === "wishlist";
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, dayId: number) => {
    if (
      e.dataTransfer.types.includes(STOP_DRAG_TYPE) ||
      e.dataTransfer.types.includes(WISHLIST_DRAG_TYPE)
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTargetId(dayId);
    }
  };

  const handleDragLeave = () => {
    setDropTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, toDayId: number) => {
    setDropTargetId(null);

    // Stop drag from another day
    const stopData = e.dataTransfer.getData(STOP_DRAG_TYPE);
    if (stopData) {
      try {
        const { pinId, fromDayId } = JSON.parse(stopData);
        if (fromDayId !== toDayId) {
          movePinToDay(fromDayId, pinId, toDayId);
        }
      } catch { /* ignore */ }
      return;
    }

    // Wishlist drag
    const wishData = e.dataTransfer.getData(WISHLIST_DRAG_TYPE);
    if (wishData) {
      try {
        const { pinId } = JSON.parse(wishData);
        moveWishlistToDay(pinId, toDayId);
      } catch { /* ignore */ }
    }
  };

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto scrollbar-hide"
      onDragLeave={handleDragLeave}
    >
      {trip.days.map((day) => {
        const isActive = day.id === activeDayId && !isWishlist;
        const isDropTarget = dropTargetId === day.id;
        return (
          <button
            key={day.id}
            onClick={() => setActiveDayId(day.id)}
            onDragOver={(e) => handleDragOver(e, day.id)}
            onDrop={(e) => handleDrop(e, day.id)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isDropTarget ? "scale-110" : ""
            }`}
            style={{
              backgroundColor: isActive || isDropTarget ? day.color : dark ? `${day.color}20` : `${day.color}15`,
              color: isActive || isDropTarget ? "white" : day.color,
              border: `1.5px solid ${isActive || isDropTarget ? day.color : "transparent"}`,
              boxShadow: isDropTarget ? `0 0 0 2px white, 0 0 0 4px ${day.color}` : undefined,
            }}
          >
            {day.label}
          </button>
        );
      })}
      <button
        onClick={addDay}
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${
          dark ? "text-zinc-400 hover:bg-[#F5E8D8]/10" : "text-zinc-400 hover:bg-[#4E8098]/8"
        }`}
      >
        +
      </button>
    </div>
  );
}
