"use client";

import { useState } from "react";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { HOTEL_COLOR } from "@/store/constants";
import { ghostBtnSoft } from "@/lib/styles";
import HotelSearch from "./hotels/HotelSearch";
import HotelItem from "./hotels/HotelItem";

export default function HotelStrip() {
  const trip = useTripStore(selectActiveTrip);
  const addHotel = useTripStore((s) => s.addHotel);
  const dark = useTripStore((s) => s.darkMode);
  const [searching, setSearching] = useState(false);

  const handleSelect = (name: string, address: string, lat: number, lng: number) => {
    addHotel({ name, address, x: lng, y: lat });
    setSearching(false);
  };

  if (searching) {
    return (
      <>
        {trip.hotels.map((h) => <HotelItem key={h.id} hotel={h} />)}
        <HotelSearch onSelect={handleSelect} onCancel={() => setSearching(false)} />
      </>
    );
  }

  return (
    <>
      {trip.hotels.map((h) => <HotelItem key={h.id} hotel={h} />)}
      <button
        onClick={() => setSearching(true)}
        className={`flex items-center gap-2 mx-3 mt-2 px-3 py-2 rounded-xl text-sm transition-colors w-auto ${
          ghostBtnSoft(dark)
        }`}
      >
        <span className="w-7 h-7 rounded-lg border-2 border-dashed flex items-center justify-center text-xs"
          style={{ borderColor: HOTEL_COLOR, color: HOTEL_COLOR }}>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </span>
        <span>{trip.hotels.length === 0 ? "Set hotel / base" : "+ Add another hotel"}</span>
      </button>
    </>
  );
}
