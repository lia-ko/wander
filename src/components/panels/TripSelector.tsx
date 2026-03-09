"use client";

import { useState } from "react";
import { useTripStore } from "@/store/tripStore";
import { textMuted, sectionBg, hoverBg, deleteBtn } from "@/lib/styles";
import NewTripModal from "./NewTripModal";

export default function TripSelector() {
  const trips = useTripStore((s) => s.trips);
  const activeTripId = useTripStore((s) => s.activeTripId);
  const setActiveTripId = useTripStore((s) => s.setActiveTripId);
  const removeTrip = useTripStore((s) => s.removeTrip);
  const toggleSidebar = useTripStore((s) => s.toggleSidebar);
  const newTripModalOpen = useTripStore((s) => s.newTripModalOpen);
  const setNewTripModalOpen = useTripStore((s) => s.setNewTripModalOpen);
  const dark = useTripStore((s) => s.darkMode);
  const [open, setOpen] = useState(false);

  const activeTrip = trips.find((t) => t.id === activeTripId)!;

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-inherit">
        <div className="relative flex-1">
          <button
            onClick={() => setOpen(!open)}
            className={`flex items-center gap-2 w-full text-left rounded-lg px-2 py-1.5 transition-colors ${
              hoverBg(dark)
            }`}
          >
            <span className="text-lg">{activeTrip.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{activeTrip.name}</div>
              <div className={`text-xs ${textMuted(dark)}`}>{activeTrip.dates}</div>
            </div>
            <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50 overflow-hidden
              ${dark ? "bg-[#252525] border-[#F5E8D8]/10" : "bg-white border-[#4E8098]/15"}`}>
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors
                    ${trip.id === activeTripId
                      ? sectionBg(dark)
                      : dark ? "hover:bg-[#F5E8D8]/6" : "hover:bg-[#4E8098]/8"
                    }`}
                >
                  <button
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    onClick={() => { setActiveTripId(trip.id); setOpen(false); }}
                  >
                    <span>{trip.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{trip.name}</div>
                      <div className={`text-xs ${textMuted(dark)}`}>{trip.destination}</div>
                    </div>
                    <span className={`text-xs flex-shrink-0 ${textMuted(dark)}`}>{trip.dates}</span>
                  </button>
                  {trips.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrip(trip.id);
                        if (trips.length <= 2) setOpen(false);
                      }}
                      className={`p-1 rounded transition-colors flex-shrink-0 ${
                        deleteBtn(dark)
                      }`}
                      title="Delete trip"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => { setOpen(false); setNewTripModalOpen(true); }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm border-t
                  ${dark ? "border-[#F5E8D8]/10 text-zinc-400 hover:bg-[#F5E8D8]/6" : "border-[#4E8098]/10 text-zinc-500 hover:bg-[#4E8098]/8"}`}
              >
                <span>+</span>
                <span>New trip</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className={`p-1.5 rounded-lg transition-colors ${hoverBg(dark)}`}
          title="Collapse panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {newTripModalOpen && <NewTripModal />}
    </>
  );
}
