"use client";

import dynamic from "next/dynamic";
import MainPanel from "@/components/panels/MainPanel";
import DiscoverPanel from "@/components/panels/DiscoverPanel";
import MapControls from "@/components/map/MapControls";

// Leaflet must be loaded client-side only (no SSR)
const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

export default function Home() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Map layer — full bleed */}
      <MapView />

      {/* Floating UI panels */}
      <MainPanel />
      <DiscoverPanel />
      <MapControls />
    </div>
  );
}
