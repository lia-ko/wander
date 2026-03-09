"use client";

import { useEffect, useState } from "react";
import { useUndoStore } from "@/store/undoStore";
import { useTripStore } from "@/store/tripStore";

export default function UndoBar() {
  const snapshot = useUndoStore((s) => s.snapshot);
  const label = useUndoStore((s) => s.label);
  const undo = useTripStore((s) => s.undo);
  const dark = useTripStore((s) => s.darkMode);
  const [visible, setVisible] = useState(false);

  // Show when a new snapshot arrives, auto-hide after 6s
  useEffect(() => {
    if (snapshot) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 6000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [snapshot]);

  if (!visible || !snapshot) return null;

  return (
    <div className={`mx-3 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium animate-toast-in ${
      dark
        ? "bg-[#F5E8D8]/10 text-zinc-300 border border-[#F5E8D8]/10"
        : "bg-white/80 text-zinc-700 border border-[#4E8098]/15 shadow-sm"
    }`}>
      <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
      </svg>
      <span className="flex-1 truncate">{label}</span>
      <button
        onClick={() => { undo(); setVisible(false); }}
        className={`flex-shrink-0 px-2.5 py-1 rounded-lg font-bold transition-colors ${
          dark
            ? "bg-[#DAA520]/20 text-[#DAA520] hover:bg-[#DAA520]/30"
            : "bg-[#4E8098]/15 text-[#4E8098] hover:bg-[#4E8098]/25"
        }`}
      >
        Undo
      </button>
      <button
        onClick={() => setVisible(false)}
        className="flex-shrink-0 opacity-40 hover:opacity-70"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
