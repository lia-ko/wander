"use client";

import { useCallback, useRef, useEffect } from "react";
import { useTripStore } from "@/store/tripStore";
import { useUIStore } from "@/store/uiStore";
import GlassPanel from "@/components/ui/GlassPanel";
import TripSelector from "./TripSelector";
import HotelStrip from "./HotelStrip";
import DayChips from "./DayChips";
import DayTitleBar from "./DayTitleBar";
import StopList from "./StopList";
import WishlistPanel from "./WishlistPanel";
import BudgetPanel from "./BudgetPanel";
import StatsPanel from "./StatsPanel";
import BottomActionBar from "./BottomActionBar";
import UndoBar from "@/components/ui/UndoBar";
import CollapsedSidebar from "./CollapsedSidebar";

export default function MainPanel() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const sidebarWidth = useTripStore((s) => s.sidebarWidth);
  const setSidebarWidth = useTripStore((s) => s.setSidebarWidth);
  const sidebarView = useUIStore((s) => s.sidebarView);
  const dark = useTripStore((s) => s.darkMode);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(310);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      setSidebarWidth(startW.current + delta);
    };
    const handleMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
  }, [setSidebarWidth]);

  if (collapsed) return <CollapsedSidebar />;

  return (
    <GlassPanel
      className="absolute top-4 left-4 bottom-4 z-20 flex flex-col overflow-hidden"
      style={{ width: `${sidebarWidth}px` }}
    >
      <TripSelector />
      <HotelStrip />
      <DayChips />
      {sidebarView === "wishlist" ? (
        <WishlistPanel />
      ) : sidebarView === "budget" ? (
        <BudgetPanel />
      ) : sidebarView === "stats" ? (
        <StatsPanel />
      ) : (
        <>
          <DayTitleBar />
          <StopList />
        </>
      )}
      <UndoBar />
      <BottomActionBar />

      {/* Resize handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        aria-valuenow={sidebarWidth}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 50 : 10;
          if (e.key === "ArrowRight") { e.preventDefault(); setSidebarWidth(sidebarWidth + step); }
          else if (e.key === "ArrowLeft") { e.preventDefault(); setSidebarWidth(sidebarWidth - step); }
        }}
        className={`absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize group z-30 focus:outline-none focus-visible:ring-1 ${
          dark ? "focus-visible:ring-[#F5E8D8]/40" : "focus-visible:ring-[#4E8098]/40"
        }`}
      >
        <div className={`absolute inset-y-0 right-0 w-0.5 transition-colors ${
          dark ? "group-hover:bg-[#F5E8D8]/20" : "group-hover:bg-black/10"
        }`} />
      </div>
    </GlassPanel>
  );
}
