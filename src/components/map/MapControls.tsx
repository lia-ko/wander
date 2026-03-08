"use client";

import { useTripStore } from "@/store/tripStore";
import GlassPanel from "@/components/ui/GlassPanel";

export default function MapControls() {
  const dark = useTripStore((s) => s.darkMode);
  const toggleDarkMode = useTripStore((s) => s.toggleDarkMode);

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-3">
      {/* Dark mode toggle */}
      <GlassPanel className="p-1">
        <button
          onClick={toggleDarkMode}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors ${
            dark ? "hover:bg-white/10" : "hover:bg-black/5"
          }`}
          title={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? "\u2600\uFE0F" : "\u{1F319}"}
        </button>
      </GlassPanel>
    </div>
  );
}
