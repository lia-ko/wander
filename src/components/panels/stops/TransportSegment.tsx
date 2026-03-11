"use client";

import { useState, useEffect } from "react";
import { useTripStore } from "@/store/tripStore";
import { ghostBtn, dashedBorder, textSubtle } from "@/lib/styles";
import { fmtDist, fmtMins } from "@/lib/formatUtils";
import { fetchDayRoutes } from "@/lib/routing";
import type { Pin, TransportKey } from "@/types";

function getGoogleMapsUrl(from: Pin, to: Pin, mode: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.y},${from.x}&destination=${to.y},${to.x}&travelmode=${mode}`;
}

const MODES: { key: TransportKey; gMapsMode: string; icon: string; label: string }[] = [
  { key: "walk", gMapsMode: "walking", icon: "🚶", label: "Walk" },
  { key: "transit", gMapsMode: "transit", icon: "🚇", label: "Transit" },
  { key: "car", gMapsMode: "driving", icon: "🚗", label: "Drive" },
];

export default function TransportSegment({ pin, prevPin, dayId }: { pin: Pin; prevPin: Pin; dayId: number }) {
  const updatePin = useTripStore((s) => s.updatePin);
  const dark = useTripStore((s) => s.darkMode);
  const hasCoords = prevPin.y !== 0 && prevPin.x !== 0 && pin.y !== 0 && pin.x !== 0;

  const activeMode = MODES.find((m) => m.key === pin.transport) ?? MODES[0];

  // Fetch route info from Valhalla
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [timeMins, setTimeMins] = useState<number | null>(null);

  useEffect(() => {
    if (!hasCoords) return;

    const ac = new AbortController();
    fetchDayRoutes(
      [
        { y: prevPin.y, x: prevPin.x, transport: null },
        { y: pin.y, x: pin.x, transport: pin.transport },
      ],
      ac.signal,
    ).then((segs) => {
      if (segs[0]) {
        setDistanceKm(segs[0].distanceKm);
        setTimeMins(segs[0].timeMins);
      }
    }).catch(() => {});

    return () => ac.abort();
  }, [hasCoords, prevPin.y, prevPin.x, pin.y, pin.x, pin.transport]);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePin(dayId, pin.id, { transport: e.target.value as TransportKey });
  };

  return (
    <div className="my-0.5 ml-7">
      {/* Top connector line */}
      <div className="ml-1.5">
        <div className={`w-px h-3 border-l border-dashed ${dashedBorder(dark)}`} />
      </div>

      {/* Compact transport row */}
      <div className={`flex items-center gap-2 py-1 px-2 rounded-lg ${
        dark ? "bg-[#F5E8D8]/4" : "bg-[#F0D5A8]/10"
      }`}>
        {/* Transport dropdown */}
        <select
          value={pin.transport ?? "walk"}
          onChange={handleSelect}
          className={`text-xs font-medium rounded-md px-1.5 py-1 outline-none cursor-pointer appearance-none ${
            dark
              ? "bg-[#F5E8D8]/8 text-zinc-300 hover:bg-[#F5E8D8]/12"
              : "bg-[#4E8098]/8 text-zinc-600 hover:bg-[#4E8098]/12"
          }`}
          style={{ backgroundImage: "none" }}
        >
          {MODES.map((m) => (
            <option key={m.key} value={m.key}>
              {m.icon} {m.label}
            </option>
          ))}
        </select>

        {/* Route info */}
        {hasCoords && (distanceKm != null || timeMins != null) ? (
          <span className={`text-xs ${textSubtle(dark)}`}>
            {timeMins != null && fmtMins(timeMins)}
            {timeMins != null && distanceKm != null && " · "}
            {distanceKm != null && fmtDist(distanceKm)}
          </span>
        ) : hasCoords ? (
          <span className={`text-xs ${textSubtle(dark)} opacity-50`}>…</span>
        ) : null}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Google Maps link */}
        {hasCoords && (
          <a
            href={getGoogleMapsUrl(prevPin, pin, activeMode.gMapsMode)}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium transition-colors flex-shrink-0 ${
              ghostBtn(dark)
            }`}
            title="Open in Google Maps"
          >
            Maps
            <svg className="w-2.5 h-2.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      {/* Bottom connector line */}
      <div className="ml-1.5">
        <div className={`w-px h-3 border-l border-dashed ${dashedBorder(dark)}`} />
      </div>
    </div>
  );
}
