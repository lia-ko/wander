"use client";

import { useTripStore } from "@/store/tripStore";
import { exportTripPdf } from "@/components/export/exportPdf";
import html2canvas from "html2canvas";

export default function BottomActionBar() {
  const toggleDiscover = useTripStore((s) => s.toggleDiscover);
  const discoverOpen = useTripStore((s) => s.discoverOpen);
  const discoverTab = useTripStore((s) => s.discoverTab);
  const dark = useTripStore((s) => s.darkMode);

  const discoverButtons = [
    { key: "eat" as const, emoji: "\u{1F37D}\uFE0F", label: "Eat Out" },
    { key: "grocers" as const, emoji: "\u{1F6D2}", label: "Grocers" },
    { key: "attractions" as const, emoji: "\u{1F5FA}\uFE0F", label: "Attractions" },
  ];

  const btnClass = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold transition-all ${
      active
        ? dark ? "bg-white/15 text-white" : "bg-black/10 text-zinc-900"
        : dark ? "bg-white/5 text-zinc-300 hover:bg-white/10" : "bg-black/[.03] text-zinc-600 hover:bg-black/[.06]"
    }`;

  return (
    <div className={`border-t px-3 py-2.5 flex flex-col gap-2 ${dark ? "border-white/10" : "border-black/5"}`}>
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

      {/* Export */}
      <button
        onClick={async () => {
          const trip = useTripStore.getState().getActiveTrip();
          const mapEl = document.querySelector(".leaflet-container") as HTMLElement | null;
          let mapCanvas: HTMLCanvasElement | null = null;
          if (mapEl) {
            mapCanvas = await html2canvas(mapEl, { useCORS: true, allowTaint: true });
          }
          await exportTripPdf(trip, mapCanvas);
        }}
        className={btnClass(false)}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export PDF
      </button>
    </div>
  );
}
