"use client";

import { useState } from "react";
import { useTripStore } from "@/store/tripStore";
import { ghostBtn, dashedBorder } from "@/lib/styles";
import type { Pin, TransportKey } from "@/types";

function getGoogleMapsUrl(from: Pin, to: Pin, mode: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.y},${from.x}&destination=${to.y},${to.x}&travelmode=${mode}`;
}

const MODES = [
  { key: "walk" as TransportKey, gMapsMode: "walking", emoji: "\u{1F6B6}", label: "Walk", color: "#6B7280" },
  { key: "transit" as TransportKey, gMapsMode: "transit", emoji: "\u{1F687}", label: "Transit", color: "#3B82F6" },
  { key: "car" as TransportKey, gMapsMode: "driving", emoji: "\u{1F697}", label: "Drive", color: "#EF4444" },
];

export default function TransportSegment({ pin, prevPin, dayId }: { pin: Pin; prevPin: Pin; dayId: number }) {
  const updatePin = useTripStore((s) => s.updatePin);
  const dark = useTripStore((s) => s.darkMode);
  const [editingTime, setEditingTime] = useState(false);
  const [timeText, setTimeText] = useState(pin.travelTime || "");
  const hasCoords = prevPin.y !== 0 && prevPin.x !== 0 && pin.y !== 0 && pin.x !== 0;

  const activeMode = MODES.find((m) => m.key === pin.transport);

  const handleSelect = (key: TransportKey) => {
    updatePin(dayId, pin.id, { transport: key });
  };

  const handleSaveTime = () => {
    updatePin(dayId, pin.id, { travelTime: timeText.trim() || null });
    setEditingTime(false);
  };

  return (
    <div className="mx-2 my-1">
      {/* Dashed connector */}
      <div className="ml-3 mb-1">
        <div className={`w-px h-3 border-l border-dashed ${dashedBorder(dark)}`} style={{ marginLeft: "8px" }} />
      </div>

      <div className={`rounded-xl overflow-hidden ${dark ? "bg-[#F5E8D8]/6" : "bg-[#F0D5A8]/15"}`}>
        {/* Mode selector row */}
        <div className="flex items-center gap-1 px-2 pt-2 pb-1.5">
          {MODES.map((mode) => {
            const isActive = pin.transport === mode.key;
            return (
              <button
                key={mode.key}
                onClick={() => handleSelect(mode.key)}
                className={`flex items-center gap-1.5 flex-1 justify-center px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "text-white shadow-sm"
                    : ghostBtn(dark)
                }`}
                style={isActive ? { backgroundColor: mode.color } : undefined}
              >
                <span>{mode.emoji}</span>
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Travel time + Google Maps link */}
        <div className="flex items-center gap-1.5 px-2 pb-2">
          {editingTime ? (
            <input
              type="text"
              value={timeText}
              onChange={(e) => setTimeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTime();
                if (e.key === "Escape") { setTimeText(pin.travelTime || ""); setEditingTime(false); }
              }}
              onBlur={handleSaveTime}
              autoFocus
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs outline-none ${
                dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8] placeholder:text-zinc-500" : "bg-[#4E8098]/8 text-zinc-900 placeholder:text-zinc-400"
              }`}
              placeholder="e.g. 48 min"
            />
          ) : (
            <button
              onClick={() => { setTimeText(pin.travelTime || ""); setEditingTime(true); }}
              className={`flex-1 flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                pin.travelTime
                  ? dark ? "text-zinc-300" : "text-zinc-600"
                  : dark ? "text-zinc-600 hover:bg-[#F5E8D8]/6" : "text-zinc-400 hover:bg-[#F0D5A8]/25"
              }`}
            >
              <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {pin.travelTime || "Add travel time"}
            </button>
          )}
          {hasCoords && (
            <a
              href={getGoogleMapsUrl(prevPin, pin, activeMode?.gMapsMode || "walking")}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors flex-shrink-0 ${
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
      </div>

      {/* Dashed connector */}
      <div className="ml-3 mt-1">
        <div className={`w-px h-3 border-l border-dashed ${dashedBorder(dark)}`} style={{ marginLeft: "8px" }} />
      </div>
    </div>
  );
}
