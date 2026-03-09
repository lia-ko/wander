"use client";

import { useRef } from "react";
import { useTripStore } from "@/store/tripStore";
import { exportTripPdf } from "@/components/export/exportPdf";
import { toast } from "@/store/toastStore";
import { accentActive, inactiveBtn } from "@/lib/styles";
import html2canvas from "html2canvas";
import type { Trip } from "@/types";

function validateTrips(data: unknown): data is Trip[] {
  if (!Array.isArray(data)) return false;
  for (const t of data) {
    if (typeof t !== "object" || t === null) return false;
    if (typeof t.id !== "number" || typeof t.name !== "string") return false;
    if (!Array.isArray(t.days)) return false;
    for (const d of t.days) {
      if (typeof d.id !== "number" || !Array.isArray(d.pins)) return false;
    }
  }
  return true;
}

export default function BottomActionBar() {
  const toggleDiscover = useTripStore((s) => s.toggleDiscover);
  const discoverOpen = useTripStore((s) => s.discoverOpen);
  const discoverTab = useTripStore((s) => s.discoverTab);
  const sidebarView = useTripStore((s) => s.sidebarView);
  const setSidebarView = useTripStore((s) => s.setSidebarView);
  const trip = useTripStore((s) => s.trips.find((t) => t.id === s.activeTripId)!);
  const dark = useTripStore((s) => s.darkMode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wishlistCount = (trip.wishlist ?? []).length;
  const isWishlist = sidebarView === "wishlist";
  const isBudget = sidebarView === "budget";
  const expenseCount = (trip.expenses ?? []).length;

  const discoverButtons = [
    { key: "eat" as const, emoji: "\u{1F37D}\uFE0F", label: "Eat Out" },
    { key: "grocers" as const, emoji: "\u{1F6D2}", label: "Grocers" },
    { key: "attractions" as const, emoji: "\u{1F5FA}\uFE0F", label: "Attractions" },
  ];

  const btnClass = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold transition-all ${
      active
        ? accentActive(dark)
        : inactiveBtn(dark)
    }`;

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
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so re-selecting same file still triggers
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const trips = parsed as unknown;
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
  };

  return (
    <div className={`border-t px-3 py-2.5 flex flex-col gap-2 ${dark ? "border-[#F5E8D8]/10" : "border-[#4E8098]/10"}`}>
      {/* Wishlist & Budget toggles */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setSidebarView(isWishlist ? "day" : "wishlist")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            isWishlist
              ? accentActive(dark)
              : inactiveBtn(dark)
          }`}
        >
          <svg className="w-3.5 h-3.5" fill={isWishlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Wishlist
          {wishlistCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              isWishlist
                ? dark ? "bg-[#DAA520]/30" : "bg-[#4E8098]/20"
                : dark ? "bg-[#F5E8D8]/10" : "bg-[#4E8098]/8"
            }`}>
              {wishlistCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setSidebarView(isBudget ? "day" : "budget")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            isBudget
              ? accentActive(dark)
              : inactiveBtn(dark)
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Budget
          {expenseCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              isBudget
                ? dark ? "bg-[#DAA520]/30" : "bg-[#4E8098]/20"
                : dark ? "bg-[#F5E8D8]/10" : "bg-[#4E8098]/8"
            }`}>
              {expenseCount}
            </span>
          )}
        </button>
      </div>

      {/* Discover row */}
      <div className="flex items-center gap-1.5">
        {discoverButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => toggleDiscover(btn.key)}
            className={btnClass(discoverOpen && discoverTab === btn.key)}
          >
            <span>{btn.emoji}</span>
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Export/Import row */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={async () => {
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
          }}
          className={btnClass(false)}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF
        </button>

        <button onClick={handleExportJson} className={btnClass(false)}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Save
        </button>

        <button onClick={() => fileInputRef.current?.click()} className={btnClass(false)}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Load
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportJson}
          className="hidden"
        />
      </div>
    </div>
  );
}
