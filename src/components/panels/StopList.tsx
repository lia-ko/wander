"use client";

import { useState } from "react";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { textSubtle, dashedBorder } from "@/lib/styles";
import { WISHLIST_DRAG_TYPE } from "./WishlistPanel";
import { STOP_DRAG_TYPE } from "./stops/types";
import StopItem from "./stops/StopItem";
import FlightItem from "./stops/FlightItem";
import TransportSegment from "./stops/TransportSegment";
import AddStopSearch from "./stops/AddStopSearch";

// Re-export for DayChips and other consumers
export { STOP_DRAG_TYPE };

export default function StopList() {
  const trip = useTripStore(selectActiveTrip);
  const activeDayId = useTripStore((s) => s.activeDayId);
  const reorderPin = useTripStore((s) => s.reorderPin);
  const moveWishlistToDay = useTripStore((s) => s.moveWishlistToDay);
  const dark = useTripStore((s) => s.darkMode);

  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [wishlistDragOver, setWishlistDragOver] = useState(false);

  const day = trip.days.find((d) => d.id === activeDayId);
  if (!day) return null;

  const handleDragStart = (e: React.DragEvent, i: number) => {
    setDragFrom(i);
    const pin = day.pins[i];
    if (pin) {
      e.dataTransfer.setData(STOP_DRAG_TYPE, JSON.stringify({ pinId: pin.id, fromDayId: day.id }));
      e.dataTransfer.effectAllowed = "move";
    }
  };
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOver(i);
  };
  const handleDrop = (toIndex: number) => {
    if (dragFrom !== null && dragFrom !== toIndex) {
      reorderPin(day.id, dragFrom, toIndex);
    }
    setDragFrom(null);
    setDragOver(null);
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(WISHLIST_DRAG_TYPE)) {
      e.preventDefault();
      setWishlistDragOver(true);
    }
  };

  const handleContainerDragLeave = () => {
    setWishlistDragOver(false);
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    setWishlistDragOver(false);
    const data = e.dataTransfer.getData(WISHLIST_DRAG_TYPE);
    if (!data) return;
    try {
      const { pinId } = JSON.parse(data);
      moveWishlistToDay(pinId, day.id);
    } catch { /* ignore */ }
  };

  return (
    <div
      className={`flex-1 overflow-y-auto py-1 scrollbar-hide transition-colors ${
        wishlistDragOver
          ? dark ? "bg-[#DAA520]/5 ring-1 ring-inset ring-[#DAA520]/20 rounded-xl" : "bg-[#4E8098]/5 ring-1 ring-inset ring-[#4E8098]/20 rounded-xl"
          : ""
      }`}
      onDragEnd={() => { setDragFrom(null); setDragOver(null); setWishlistDragOver(false); }}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
    >
      {day.pins.map((pin, i) => {
        const prev = i > 0 ? day.pins[i - 1] : null;
        const isFlight = pin.pinType === "flight";
        const prevIsFlight = prev?.pinType === "flight";
        const showTransport = i > 0 && !isFlight && !prevIsFlight;

        return (
          <div key={pin.id}>
            {showTransport && <TransportSegment pin={pin} prevPin={prev!} dayId={day.id} />}
            {i > 0 && !showTransport && (
              <div className="ml-5 my-1">
                <div className={`w-px h-4 border-l border-dashed ${dashedBorder(dark)}`} style={{ marginLeft: "8px" }} />
              </div>
            )}
            {isFlight ? (
              <FlightItem
                pin={pin}
                index={i}
                dayId={day.id}
                dayColor={day.color}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragOver={dragOver === i && dragFrom !== i}
              />
            ) : (
              <StopItem
                pin={pin}
                index={i}
                dayId={day.id}
                dayColor={day.color}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragOver={dragOver === i && dragFrom !== i}
              />
            )}
          </div>
        );
      })}

      {day.pins.length === 0 && (
        <div className={`text-center py-8 text-sm ${textSubtle(dark)}`}>
          No stops yet. Add a stop below or drop a pin on the map.
        </div>
      )}

      <AddStopSearch dayId={day.id} dayColor={day.color} />
    </div>
  );
}
