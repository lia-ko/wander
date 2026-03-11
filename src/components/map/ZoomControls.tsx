"use client";

import { useMap } from "react-leaflet";
import { useTripStore } from "@/store/tripStore";

export default function ZoomControls() {
  const map = useMap();
  const dark = useTripStore((s) => s.darkMode);

  const btnClass = `w-9 h-9 flex items-center justify-center text-lg font-bold transition-colors ${
    dark
      ? "text-zinc-200 hover:bg-white/10"
      : "text-zinc-700 hover:bg-black/5"
  }`;

  return (
    <div
      className={`absolute bottom-6 right-4 z-[1000] rounded-xl overflow-hidden shadow-lg backdrop-blur-md ${
        dark ? "bg-[#1C1C1C]/80 border border-white/10" : "bg-white/80 border border-black/10"
      }`}
    >
      <button onClick={() => map.zoomIn()} className={btnClass} aria-label="Zoom in">+</button>
      <div className={`h-px ${dark ? "bg-white/10" : "bg-black/10"}`} />
      <button onClick={() => map.zoomOut()} className={btnClass} aria-label="Zoom out">−</button>
    </div>
  );
}
