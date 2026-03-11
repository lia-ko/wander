"use client";

import { useRef, useState } from "react";
import { useTripStore, selectActiveTrip } from "@/store/tripStore";
import { useUIStore } from "@/store/uiStore";
import { exportTripPdf } from "@/components/export/exportPdf";
import { toast } from "@/store/toastStore";
import html2canvas from "html2canvas";
import type { Trip } from "@/types";

function validateTrips(data: unknown): data is Trip[] {
  if (!Array.isArray(data) || data.length > 100) return false;
  for (const t of data) {
    if (typeof t !== "object" || t === null) return false;
    // Block prototype pollution keys
    if ("__proto__" in t || "constructor" in t && typeof (t as Record<string, unknown>).constructor !== "function") return false;
    if (typeof t.id !== "number" || typeof t.name !== "string") return false;
    if (t.name.length > 200) return false;
    if (!Array.isArray(t.days) || t.days.length > 365) return false;
    if (!t.center || typeof t.center.lat !== "number" || typeof t.center.lng !== "number") return false;
    if (!isFinite(t.center.lat) || !isFinite(t.center.lng)) return false;
    // Validate day color is a safe value
    for (const d of t.days) {
      if (typeof d.id !== "number" || !Array.isArray(d.pins) || d.pins.length > 500) return false;
      if (typeof d.color === "string" && !/^#[0-9a-fA-F]{3,8}$/.test(d.color)) return false;
      for (const p of d.pins) {
        if (typeof p.name !== "string" || typeof p.x !== "number" || typeof p.y !== "number") return false;
        if (!isFinite(p.x) || !isFinite(p.y)) return false;
      }
    }
  }
  return true;
}

export default function BottomActionBar() {
  const toggleDiscover = useUIStore((s) => s.toggleDiscover);
  const discoverOpen = useUIStore((s) => s.discoverOpen);
  const sidebarView = useUIStore((s) => s.sidebarView);
  const setSidebarView = useUIStore((s) => s.setSidebarView);
  const trip = useTripStore(selectActiveTrip);
  const dark = useTripStore((s) => s.darkMode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const wishlistCount = (trip.wishlist ?? []).length;
  const isWishlist = sidebarView === "wishlist";
  const isBudget = sidebarView === "budget";
  const isStats = sidebarView === "stats";
  const expenseCount = (trip.expenses ?? []).length;

  const iconBtn = (active: boolean) =>
    `relative flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
      active
        ? dark ? "bg-[#DAA520]/20 text-[#DAA520]" : "bg-[#4E8098]/15 text-[#4E8098]"
        : dark ? "text-zinc-400 hover:bg-[#F5E8D8]/8 hover:text-zinc-200" : "text-zinc-500 hover:bg-[#4E8098]/8 hover:text-zinc-700"
    }`;

  const badge = (count: number, active: boolean) =>
    count > 0 ? (
      <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold ${
        active
          ? dark ? "bg-[#DAA520] text-[#1C1C1C]" : "bg-[#4E8098] text-white"
          : dark ? "bg-[#F5E8D8]/15 text-zinc-300" : "bg-[#4E8098]/10 text-zinc-600"
      }`}>
        {count}
      </span>
    ) : null;

  const handleExportJson = () => {
    try {
      const trips = useTripStore.getState().trips;
      const json = JSON.stringify(trips, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wander_trips_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Trips exported successfully!", "success");
    } catch {
      toast("Export failed — please try again.");
    }
    setMenuOpen(false);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result;
        if (typeof raw !== "string") {
          toast("Could not read file.");
          return;
        }
        const trips: unknown = JSON.parse(raw);
        if (!validateTrips(trips)) {
          toast("Invalid file — not a valid Wander trips export.");
          return;
        }
        if (trips.length === 0) {
          toast("The file contains no trips.");
          return;
        }
        useTripStore.getState().importTrips(trips);
        toast(`Imported ${trips.length} trip${trips.length > 1 ? "s" : ""} successfully!`, "success");
      } catch {
        toast("Could not read file — make sure it's a valid JSON export.");
      }
    };
    reader.onerror = () => toast("Failed to read file.");
    reader.readAsText(file);
    setMenuOpen(false);
  };

  const handleExportPdf = async () => {
    setMenuOpen(false);
    try {
      const t = useTripStore.getState().getActiveTrip();
      const mapEl = document.querySelector(".leaflet-container") as HTMLElement | null;
      let mapCanvas: HTMLCanvasElement | null = null;
      if (mapEl) {
        mapCanvas = await html2canvas(mapEl, { useCORS: true, allowTaint: true });
      }
      await exportTripPdf(t, mapCanvas);
      toast("PDF exported successfully!", "success");
    } catch {
      toast("PDF export failed — please try again.");
    }
  };

  const menuItemClass = `flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
    dark ? "text-zinc-300 hover:bg-[#F5E8D8]/10" : "text-zinc-600 hover:bg-[#4E8098]/8"
  }`;

  return (
    <div className={`border-t px-3 py-2 ${dark ? "border-[#F5E8D8]/10" : "border-[#4E8098]/10"}`}>
      <div className="flex items-center justify-around">
        {/* Day view */}
        <button
          onClick={() => setSidebarView("day")}
          className={iconBtn(sidebarView === "day")}
          title="Itinerary"
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </button>

        {/* Wishlist */}
        <button
          onClick={() => setSidebarView(isWishlist ? "day" : "wishlist")}
          className={iconBtn(isWishlist)}
          title="Wishlist"
        >
          <svg className="w-[18px] h-[18px]" fill={isWishlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {badge(wishlistCount, isWishlist)}
        </button>

        {/* Budget */}
        <button
          onClick={() => setSidebarView(isBudget ? "day" : "budget")}
          className={iconBtn(isBudget)}
          title="Budget"
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {badge(expenseCount, isBudget)}
        </button>

        {/* Stats */}
        <button
          onClick={() => setSidebarView(isStats ? "day" : "stats")}
          className={iconBtn(isStats)}
          title="Stats"
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>

        {/* Divider */}
        <div className={`w-px h-5 ${dark ? "bg-[#F5E8D8]/10" : "bg-[#4E8098]/10"}`} />

        {/* Discover */}
        <button
          onClick={() => toggleDiscover()}
          className={iconBtn(discoverOpen)}
          title="Discover places"
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* More menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={iconBtn(menuOpen)}
            title="More actions"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop to close */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />

              {/* Menu popover */}
              <div className={`absolute bottom-full right-0 mb-2 w-48 rounded-xl overflow-hidden shadow-lg z-50 py-1.5 px-1.5 ${
                dark ? "bg-[#1C1C1C] border border-[#F5E8D8]/10" : "bg-white border border-black/10"
              }`}>
                <button onClick={handleExportPdf} className={menuItemClass} aria-label="Export PDF">
                  <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </button>
                <button onClick={handleExportJson} className={menuItemClass} aria-label="Save as JSON">
                  <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Save as JSON
                </button>
                <button onClick={() => { fileInputRef.current?.click(); }} className={menuItemClass} aria-label="Load from JSON">
                  <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Load from JSON
                </button>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJson}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
