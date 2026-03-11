"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import MainPanel from "@/components/panels/MainPanel";
import DiscoverPanel from "@/components/panels/discover/DiscoverPanel";
import MapControls from "@/components/map/MapControls";
import TimelineBar from "@/components/panels/TimelineBar";
import ToastContainer from "@/components/ui/ToastContainer";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useTripStore } from "@/store/tripStore";
import { useUndoStore } from "@/store/undoStore";

// Leaflet must be loaded client-side only (no SSR)
const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

export default function Home() {
  const undo = useTripStore((s) => s.undo);
  const hasSnapshot = useUndoStore((s) => s.snapshot !== null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey && hasSnapshot) {
        // Don't undo if user is typing in an input
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, hasSnapshot]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col w-screen h-screen overflow-hidden">
        <div className="relative flex-1 min-h-0">
          {/* Map layer — full bleed */}
          <MapView />

          {/* Floating UI panels */}
          <MainPanel />
          <DiscoverPanel />
          <MapControls />
          <ToastContainer />
        </div>

        {/* Bottom timeline strip */}
        <TimelineBar />
      </div>
    </ErrorBoundary>
  );
}
