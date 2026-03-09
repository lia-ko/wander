"use client";

import { useState } from "react";
import { useTripStore } from "@/store/tripStore";
import PlaceSearch from "../PlaceSearch";

function FlightForm({ dayId, onDone }: { dayId: number; onDone: () => void }) {
  const addPin = useTripStore((s) => s.addPin);
  const dark = useTripStore((s) => s.darkMode);
  const [airline, setAirline] = useState("");
  const [flightNum, setFlightNum] = useState("");
  const [depAirport, setDepAirport] = useState("");
  const [arrAirport, setArrAirport] = useState("");
  const [depTime, setDepTime] = useState("");
  const [arrTime, setArrTime] = useState("");

  const inputCls = `w-full px-2.5 py-2 rounded-lg text-xs outline-none ${
    dark ? "bg-[#F5E8D8]/10 text-[#F5E8D8] placeholder:text-zinc-500" : "bg-white text-zinc-900 placeholder:text-zinc-400"
  }`;

  const handleAdd = () => {
    addPin(dayId, {
      name: `${airline.trim()} ${flightNum.trim()}`.trim() || "Flight",
      category: "Flight",
      note: null,
      transport: null,
      travelTime: null,
      x: 0,
      y: 0,
      pinType: "flight",
      airline: airline.trim() || undefined,
      flightNumber: flightNum.trim() || undefined,
      departureAirport: depAirport.trim() || undefined,
      arrivalAirport: arrAirport.trim() || undefined,
      departureTime: depTime.trim() || undefined,
      arrivalTime: arrTime.trim() || undefined,
    });
    onDone();
  };

  return (
    <div className={`mx-2 mt-1 rounded-xl overflow-hidden px-3 py-2.5 space-y-1.5 ${dark ? "bg-[#F5E8D8]/10" : "bg-[#4E8098]/8"}`}>
      <div className="flex gap-2">
        <input type="text" value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Airline" autoFocus className={inputCls} />
        <input type="text" value={flightNum} onChange={(e) => setFlightNum(e.target.value)} placeholder="Flight #" className={inputCls} />
      </div>
      <div className="flex gap-2">
        <input type="text" value={depAirport} onChange={(e) => setDepAirport(e.target.value)} placeholder="From (e.g. JFK)" className={inputCls} />
        <input type="text" value={arrAirport} onChange={(e) => setArrAirport(e.target.value)} placeholder="To (e.g. MAD)" className={inputCls} />
      </div>
      <div className="flex gap-2">
        <input type="text" value={depTime} onChange={(e) => setDepTime(e.target.value)} placeholder="Departs (e.g. 10:30 AM)" className={inputCls} />
        <input type="text" value={arrTime} onChange={(e) => setArrTime(e.target.value)} placeholder="Arrives (e.g. 11:45 PM)" className={inputCls} />
      </div>
      <div className="flex gap-1.5 pt-1">
        <button onClick={handleAdd} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors">Add Flight</button>
        <button onClick={onDone} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${dark ? "bg-[#F5E8D8]/10 hover:bg-[#F5E8D8]/15" : "bg-zinc-200 hover:bg-zinc-300"}`}>Cancel</button>
      </div>
    </div>
  );
}

export default function AddStopSearch({ dayId, dayColor }: { dayId: number; dayColor: string }) {
  const [mode, setMode] = useState<"closed" | "stop" | "flight">("closed");
  const addPin = useTripStore((s) => s.addPin);
  const dark = useTripStore((s) => s.darkMode);

  if (mode === "closed") {
    return (
      <div className="flex items-center gap-1.5 mx-2 mt-1">
        <button
          onClick={() => setMode("stop")}
          className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl text-sm transition-colors ${
            dark ? "text-zinc-400 hover:bg-[#F5E8D8]/6" : "text-zinc-400 hover:bg-[#F0D5A8]/25"
          }`}
        >
          <span className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center text-xs"
            style={{ borderColor: dayColor, color: dayColor }}>+</span>
          <span>Add a stop</span>
        </button>
        <button
          onClick={() => setMode("flight")}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
            dark ? "text-zinc-400 hover:bg-[#3B82F6]/10" : "text-zinc-400 hover:bg-[#3B82F6]/8"
          }`}
        >
          <span className="w-6 h-6 rounded-full border-2 border-dashed border-[#3B82F6] text-[#3B82F6] flex items-center justify-center">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </span>
          <span>Flight</span>
        </button>
      </div>
    );
  }

  if (mode === "flight") {
    return <FlightForm dayId={dayId} onDone={() => setMode("closed")} />;
  }

  return (
    <PlaceSearch
      onAdd={(name, lat, lng, displayName) => {
        const shortAddress = displayName.split(",").slice(1, 3).join(",").trim();
        addPin(dayId, {
          name,
          category: "Custom",
          note: shortAddress || null,
          transport: null,
          travelTime: null,
          x: lng,
          y: lat,
        });
        setMode("closed");
      }}
      onCancel={() => setMode("closed")}
    />
  );
}
